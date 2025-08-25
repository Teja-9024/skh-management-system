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
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''

    const products = await handleDatabaseOperation(async () => {
      const where: any = {}

      if (category) {
        where.category = category
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' as const } },
          { category: { contains: search, mode: 'insensitive' as const } },
        ]
      }

      return await prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              billItems: true,
              purchases: true,
            },
          },
        },
      })
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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

    const { name, category } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    const product = await handleDatabaseOperation(async () => {
      // Check for duplicate product name
      const existing = await prisma.product.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
        },
      })

      if (existing) {
        throw new Error('Product with this name already exists')
      }

      return await prisma.product.create({
        data: {
          name: name.trim(),
          category: category?.trim() || null,
        },
      })
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}