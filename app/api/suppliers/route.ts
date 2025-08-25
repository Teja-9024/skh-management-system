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
    const search = searchParams.get('search') || ''

    const suppliers = await handleDatabaseOperation(async () => {
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { contactInfo: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}

      return await prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              purchases: true,
            },
          },
          purchases: {
            select: {
              totalValue: true,
              purchaseDate: true,
            },
            orderBy: { purchaseDate: 'desc' },
            take: 5,
          },
        },
      })
    })

    // Calculate total purchase value for each supplier
    const suppliersWithStats = suppliers.map(supplier => ({
      ...supplier,
      totalPurchaseValue: supplier.purchases.reduce((sum, purchase) => sum + purchase.totalValue, 0),
    }))

    return NextResponse.json(suppliersWithStats)
  } catch (error) {
    console.error('Get suppliers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
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

    const { name, contactInfo } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const supplier = await handleDatabaseOperation(async () => {
      // Check for duplicate supplier name
      const existing = await prisma.supplier.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
        },
      })

      if (existing) {
        throw new Error('Supplier with this name already exists')
      }

      return await prisma.supplier.create({
        data: {
          name: name.trim(),
          contactInfo: contactInfo?.trim() || null,
        },
      })
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error: any) {
    console.error('Create supplier error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create supplier' },
      { status: 500 }
    )
  }
}