import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDatabaseOperation } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'
import { StockStatus, PaymentType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const purchase = await handleDatabaseOperation(async () => {
      return await prisma.purchase.findUnique({
        where: { id: params.id },
        include: {
          product: true,
          supplier: true,
        },
      })
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Get purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

        // Update purchase
        const updatedPurchase = await tx.purchase.update({
          where: { id: params.id },
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
          where: { id: updatedPurchase.id },
          include: {
            product: true,
            supplier: true,
          },
        })
      })
    })

    return NextResponse.json(purchase)
  } catch (error: any) {
    console.error('Update purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update purchase' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await handleDatabaseOperation(async () => {
      return await prisma.purchase.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Purchase deleted successfully' })
  } catch (error) {
    console.error('Delete purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to delete purchase' },
      { status: 500 }
    )
  }
}