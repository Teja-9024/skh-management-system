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

    const product = await handleDatabaseOperation(async () => {
      return await prisma.product.findUnique({
        where: { id: params.id },
        include: {
          billItems: {
            include: {
              bill: {
                include: {
                  customer: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          purchases: {
            include: {
              supplier: true,
            },
            orderBy: { purchaseDate: 'desc' },
            take: 10,
          },
        },
      })
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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

    const { name, category } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    const product = await handleDatabaseOperation(async () => {
      // Check for duplicate product name (excluding current product)
      const existing = await prisma.product.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: params.id },
        },
      })

      if (existing) {
        throw new Error('Product with this name already exists')
      }

      return await prisma.product.update({
        where: { id: params.id },
        data: {
          name: name.trim(),
          category: category?.trim() || null,
        },
      })
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
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
      // Check if product is used in bills or purchases
      const [billItemCount, purchaseCount] = await Promise.all([
        prisma.billItem.count({ where: { productId: params.id } }),
        prisma.purchase.count({ where: { productId: params.id } }),
      ])

      if (billItemCount > 0 || purchaseCount > 0) {
        throw new Error('Cannot delete product that is used in bills or purchases')
      }

      return await prisma.product.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error: any) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}