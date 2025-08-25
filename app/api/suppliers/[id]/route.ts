import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDatabaseOperation } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supplier = await handleDatabaseOperation(async () => {
      return await prisma.supplier.findUnique({
        where: { id: params.id },
        include: {
          purchases: {
            include: {
              product: true,
            },
            orderBy: { purchaseDate: 'desc' },
          },
        },
      })
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Calculate supplier statistics
    const totalPurchaseValue = supplier.purchases.reduce((sum, purchase) => sum + purchase.totalValue, 0)
    const totalQuantity = supplier.purchases.reduce((sum, purchase) => sum + purchase.quantity, 0)
    const uniqueProducts = new Set(supplier.purchases.map(p => p.productId)).size

    return NextResponse.json({
      ...supplier,
      stats: {
        totalPurchaseValue,
        totalQuantity,
        uniqueProducts,
        totalPurchases: supplier.purchases.length,
      },
    })
  } catch (error) {
    console.error('Get supplier error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
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

    const { name, contactInfo } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const supplier = await handleDatabaseOperation(async () => {
      // Check for duplicate supplier name (excluding current supplier)
      const existing = await prisma.supplier.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: params.id },
        },
      })

      if (existing) {
        throw new Error('Supplier with this name already exists')
      }

      return await prisma.supplier.update({
        where: { id: params.id },
        data: {
          name: name.trim(),
          contactInfo: contactInfo?.trim() || null,
        },
      })
    })

    return NextResponse.json(supplier)
  } catch (error: any) {
    console.error('Update supplier error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update supplier' },
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
      // Check if supplier has purchases
      const purchaseCount = await prisma.purchase.count({
        where: { supplierId: params.id },
      })

      if (purchaseCount > 0) {
        throw new Error('Cannot delete supplier with existing purchases')
      }

      return await prisma.supplier.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error: any) {
    console.error('Delete supplier error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}