import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDatabaseOperation } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'
import { StockStatus, PaymentType } from '@prisma/client'

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
    const supplierId = searchParams.get('supplierId')

    const skip = (page - 1) * limit

    const purchases = await handleDatabaseOperation(async () => {
      const where: any = {}

      if (search) {
        where.OR = [
          { product: { name: { contains: search, mode: 'insensitive' as const } } },
          { supplier: { name: { contains: search, mode: 'insensitive' as const } } },
        ]
      }

      if (fromDate || toDate) {
        where.purchaseDate = {}
        if (fromDate) where.purchaseDate.gte = new Date(fromDate)
        if (toDate) where.purchaseDate.lte = new Date(toDate)
      }

      if (supplierId) {
        where.supplierId = supplierId
      }

      const [purchases, total] = await Promise.all([
        prisma.purchase.findMany({
          where,
          skip,
          take: limit,
          orderBy: { purchaseDate: 'desc' },
          include: {
            product: true,
            supplier: true,
          },
        }),
        prisma.purchase.count({ where }),
      ])

      return { purchases, total, page, limit }
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Get purchases error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
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
      purchaseDate,
      product,
      supplier,
      purchasePrice,
      quantity,
      stockStatus,
      paymentType,
      borrowedAmount,
      remarks,
    } = await request.json()

    if (!product?.name?.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    if (!supplier?.name?.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    if (!purchasePrice || purchasePrice <= 0) {
      return NextResponse.json(
        { error: 'Valid purchase price is required' },
        { status: 400 }
      )
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      )
    }

    const purchase = await handleDatabaseOperation(async () => {
      return await prisma.$transaction(async (tx) => {
        // Find or create product
        let productRecord = await tx.product.findFirst({
          where: {
            name: { equals: product.name.trim(), mode: 'insensitive' },
          },
        })

        if (!productRecord) {
          productRecord = await tx.product.create({
            data: {
              name: product.name.trim(),
              category: product.category?.trim() || null,
            },
          })
        }

        // Find or create supplier
        let supplierRecord = await tx.supplier.findFirst({
          where: {
            name: { equals: supplier.name.trim(), mode: 'insensitive' },
          },
        })

        if (!supplierRecord) {
          supplierRecord = await tx.supplier.create({
            data: {
              name: supplier.name.trim(),
              contactInfo: supplier.contactInfo?.trim() || null,
            },
          })
        }

        // Calculate total value
        const totalValue = purchasePrice * quantity

        // Create purchase
        const newPurchase = await tx.purchase.create({
          data: {
            purchaseDate: new Date(purchaseDate),
            productId: productRecord.id,
            supplierId: supplierRecord.id,
            purchasePrice,
            quantity,
            stockStatus: stockStatus as StockStatus,
            totalValue,
            paymentType: paymentType as PaymentType,
            borrowedAmount: borrowedAmount || 0,
            remarks: remarks?.trim() || null,
          },
        })

        // Return purchase with relations
        return await tx.purchase.findUnique({
          where: { id: newPurchase.id },
          include: {
            product: true,
            supplier: true,
          },
        })
      })
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error: any) {
    console.error('Create purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create purchase' },
      { status: 500 }
    )
  }
}