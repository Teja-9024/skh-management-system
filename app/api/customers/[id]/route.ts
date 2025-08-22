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

    const customer = await handleDatabaseOperation(async () => {
      return await prisma.customer.findUnique({
        where: { id: params.id },
        include: {
          bills: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: { date: 'desc' },
          },
        },
      })
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
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

    const { name, mobile, address } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      )
    }

    const customer = await handleDatabaseOperation(async () => {
      return await prisma.customer.update({
        where: { id: params.id },
        data: {
          name: name.trim(),
          mobile: mobile?.trim() || null,
          address: address?.trim() || null,
        },
      })
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
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
      // Check if customer has bills
      const billCount = await prisma.bill.count({
        where: { customerId: params.id },
      })

      if (billCount > 0) {
        throw new Error('Cannot delete customer with existing bills')
      }

      return await prisma.customer.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error: any) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}