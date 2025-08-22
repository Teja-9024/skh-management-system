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

    const bill = await handleDatabaseOperation(async () => {
      return await prisma.bill.findUnique({
        where: { id: params.id },
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

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(bill)
  } catch (error) {
    console.error('Get bill error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
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
        // Check if bill number already exists (excluding current bill)
        const existingBill = await tx.bill.findFirst({
          where: {
            billNumber: billNumber.trim(),
            id: { not: params.id },
          },
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

        // Update bill
        const updatedBill = await tx.bill.update({
          where: { id: params.id },
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

        // Delete existing bill items
        await tx.billItem.deleteMany({
          where: { billId: params.id },
        })

        // Create new bill items
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
              billId: updatedBill.id,
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
          where: { id: updatedBill.id },
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

    return NextResponse.json(bill)
  } catch (error: any) {
    console.error('Update bill error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update bill' },
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
      return await prisma.bill.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Delete bill error:', error)
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    )
  }
}