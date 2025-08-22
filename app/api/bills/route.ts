import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDatabaseOperation } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'

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
            items: {
              include: {
                product: true,
              },
            },
          },
        }),
        prisma.bill.count({ where }),
      ])

      return { bills, total, page, limit }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Get bills error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    } = await request.json()

    if (!billNumber?.trim()) {
      return NextResponse.json(
        { error: 'Bill number is required' },
        { status: 400 }
      )
    }

    if (!customer?.name?.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    const bill = await handleDatabaseOperation(async () => {
      return await prisma.$transaction(async (tx) => {
        // Check if bill number already exists
        const existingBill = await tx.bill.findUnique({
          where: { billNumber: billNumber.trim() },
        })

        if (existingBill) {
          throw new Error('Bill number already exists')
        }

        // Find or create customer
        let customerRecord = await tx.customer.findFirst({
          where: {
            name: { equals: customer.name.trim(), mode: 'insensitive' },
          },
        })

        if (!customerRecord) {
          customerRecord = await tx.customer.create({
            data: {
              name: customer.name.trim(),
              mobile: customer.mobile?.trim() || null,
            },
          })
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.salePrice), 0)

        // Create bill
        const newBill = await tx.bill.create({
          data: {
            billNumber: billNumber.trim(),
            date: new Date(date),
            customerId: customerRecord.id,
            sellerName: sellerName?.trim() || null,
            savingBalance: savingBalance || 0,
            cashPayment: cashPayment || 0,
            onlinePayment: onlinePayment || 0,
            borrowedAmount: borrowedAmount || 0,
            totalAmount,
            remarks: remarks?.trim() || null,
          },
        })

        // Create bill items
        for (const item of items) {
          // Find or create product
          let product = await tx.product.findFirst({
            where: {
              name: { equals: item.productName.trim(), mode: 'insensitive' },
            },
          })

          if (!product) {
            product = await tx.product.create({
              data: {
                name: item.productName.trim(),
              },
            })
          }

          await tx.billItem.create({
            data: {
              billId: newBill.id,
              productId: product.id,
              quantity: item.quantity,
              salePrice: item.salePrice,
              purchaseCode: item.purchaseCode,
              total: item.quantity * item.salePrice,
            },
          })
        }

        // Return bill with relations
        return await tx.bill.findUnique({
          where: { id: newBill.id },
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        })
      })
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error: any) {
    console.error('Create bill error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create bill' },
      { status: 500 }
    )
  }
}