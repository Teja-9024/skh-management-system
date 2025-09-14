import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDatabaseOperation } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs' // ensure Prisma is not running on Edge

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const getNextBillNumber = searchParams.get('nextBillNumber') === 'true'

    // Next bill number (numeric)
    if (getNextBillNumber) {
      const nextBillNumber = await handleDatabaseOperation(async () => {
        const row = await prisma.$queryRaw<{ next: number }[]>`
          SELECT COALESCE(MAX(("billNumber")::int), 0) + 1 AS next
          FROM "bills"
        `
        return String(row?.[0]?.next ?? 1)
      })
      return NextResponse.json({ nextBillNumber })
    }

    const skip = (page - 1) * limit

    const bills = await handleDatabaseOperation(async () => {
      const where: any = {}

      if (search) {
        where.OR = [
          { billNumber: { contains: search, mode: 'insensitive' as const } },
          { customer: { name: { contains: search, mode: 'insensitive' as const } } },
          { sellerName: { contains: search, mode: 'insensitive' as const } },
        ]
      }

      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      const [bills, total] = await Promise.all([
        prisma.bill.findMany({
          where,
          skip,
          take: limit,
          orderBy: { date: 'desc' },
          include: {
            customer: true,
            items: { include: { product: true } },
          },
        }),
        prisma.bill.count({ where }),
      ])

      return { bills, total, page, limit }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Get bills error:', error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      billNumber,
      date,
      customer,
      sellerName,
      items,
      savingBalance,
      cashPayment,
      onlinePayment,
      borrowedAmount,
      remarks,
    } = body ?? {}

    // ---- Basic guards ----
    if (!billNumber?.trim()) {
      return NextResponse.json({ error: 'Bill number is required' }, { status: 400 })
    }
    if (!/^\d+$/.test(billNumber.trim())) {
      return NextResponse.json({ error: 'Bill number must be numeric digits only' }, { status: 400 })
    }
    if (!customer?.name?.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)
    const _saving = Math.max(0, num(savingBalance))
    const _cash = Math.max(0, num(cashPayment))
    const _online = Math.max(0, num(onlinePayment))
    const _borrow = Math.max(0, num(borrowedAmount))

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    // Minimal per-item guards
    for (const [idx, it] of items.entries()) {
      if (!it?.productName?.trim()) {
        return NextResponse.json({ error: `Item ${idx + 1}: productName is required` }, { status: 400 })
      }
      if (!Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0) {
        return NextResponse.json({ error: `Item ${idx + 1}: quantity must be > 0` }, { status: 400 })
      }
      if (!Number.isFinite(Number(it.salePrice)) || Number(it.salePrice) <= 0) {
        return NextResponse.json({ error: `Item ${idx + 1}: salePrice must be > 0` }, { status: 400 })
      }
      if (!it?.purchaseCode?.trim()) {
        return NextResponse.json({ error: `Item ${idx + 1}: purchaseCode is required` }, { status: 400 })
      }
    }

    // ---- Normalize unique product names (case-insensitive) ----
    const productNamesRaw: string[] = [
      ...new Set(items.map((it: any) => it.productName.trim()))
    ]
    const productNameConds = productNamesRaw.map((n) => ({
      name: { equals: n, mode: 'insensitive' as const }
    }))

    // ---- Main write inside a transaction with longer timeout ----
    const { billId } = await prisma.$transaction(async (tx) => {
      // Duplicate bill number check (unique on bills.billNumber)
      const existing = await tx.bill.findUnique({
        where: { billNumber: billNumber.trim() },
        select: { id: true },
      })
      if (existing) {
        const err: any = new Error('Bill number already exists')
        err._http = 409
        throw err
      }

      // Find or create customer (by case-insensitive name)
      let customerRecord = await tx.customer.findFirst({
        where: { name: { equals: customer.name.trim(), mode: 'insensitive' } },
        select: { id: true },
      })
      if (!customerRecord) {
        customerRecord = await tx.customer.create({
          data: {
            name: customer.name.trim(),
            mobile: customer.mobile?.trim() || null,
          },
          select: { id: true },
        })
      }

      // Batch: get all existing products (case-insensitive OR)
      const existingProducts = await tx.product.findMany({
        where: { OR: productNameConds },
        select: { id: true, name: true },
      })

      // Build a case-insensitive map of found products
      const foundMap = new Map<string, string>() // nameLower -> id
      for (const p of existingProducts) {
        foundMap.set(p.name.toLowerCase(), p.id)
      }

      // Determine which products are missing
      const missingNames: string[] = []
      for (const n of productNamesRaw) {
        if (!foundMap.has(n.toLowerCase())) missingNames.push(n)
      }

      // Create missing products in one go (no need to return IDs here)
      if (missingNames.length > 0) {
        await tx.product.createMany({
          data: missingNames.map((n) => ({ name: n })),
          skipDuplicates: true,
        })
        // Fetch again to get IDs for all
        const allNow = await tx.product.findMany({
          where: { OR: productNameConds },
          select: { id: true, name: true },
        })
        foundMap.clear()
        for (const p of allNow) {
          foundMap.set(p.name.toLowerCase(), p.id)
        }
      }

      // Compute total
      const totalAmount = items.reduce((sum: number, item: any) => {
        const qty = Number(item.quantity) || 0
        const price = Number(item.salePrice) || 0
        return sum + qty * price
      }, 0)

      // Create bill first
      const newBill = await tx.bill.create({
        data: {
          billNumber: billNumber.trim(),
          date: dateObj,
          customerId: customerRecord.id,
          sellerName: sellerName?.trim() || null,
          savingBalance: _saving,
          cashPayment: _cash,
          onlinePayment: _online,
          borrowedAmount: _borrow,
          totalAmount,
          remarks: remarks?.trim() || null,
        },
        select: { id: true },
      })

      // Prepare billItems rows and insert with createMany (fast)
      const billItemsData = items.map((it: any) => {
        const pid = foundMap.get(it.productName.trim().toLowerCase())
        return {
          billId: newBill.id,
          productId: pid!, // pid should exist now
          quantity: Number(it.quantity),
          salePrice: Number(it.salePrice),
          purchaseCode: it.purchaseCode.trim(),
          total: Number(it.quantity) * Number(it.salePrice),
        }
      })

      await tx.billItem.createMany({ data: billItemsData })

      return { billId: newBill.id }
    }, { timeout: 20000, maxWait: 10000 }) // <-- increase interactive tx window

    // 🔁 Final read OUTSIDE the transaction (keeps tx short)
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error: any) {
    const code = error?.code
    const http = error?._http
    console.error('Create bill error:', { message: error?.message, code, stack: error?.stack })

    if (http === 409 || code === 'P2002') {
      return NextResponse.json({ error: 'Bill number already exists' }, { status: 409 })
    }
    if (code === 'P2003') {
      return NextResponse.json({ error: 'Related record not found (foreign key)' }, { status: 400 })
    }
    if (error?.message?.includes('Transaction already closed')) {
      // Nice hint if it ever reappears
      return NextResponse.json({ error: 'Server busy. Please retry.' }, { status: 503 })
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to create bill' },
      { status: 500 }
    )
  }
}

