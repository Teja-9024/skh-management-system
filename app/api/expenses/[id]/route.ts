import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDatabaseOperation } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'
import { PaymentType, ExpenseCategory } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expense = await handleDatabaseOperation(async () => {
      return await prisma.expense.findUnique({
        where: { id: params.id },
      })
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Get expense error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
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
      date,
      expenseType,
      amount,
      paymentType,
      expenseCategory,
      remarks,
    } = await request.json()

    if (!expenseType?.trim()) {
      return NextResponse.json(
        { error: 'Expense type is required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!paymentType) {
      return NextResponse.json(
        { error: 'Payment type is required' },
        { status: 400 }
      )
    }

    if (!expenseCategory) {
      return NextResponse.json(
        { error: 'Expense category is required' },
        { status: 400 }
      )
    }

    const expense = await handleDatabaseOperation(async () => {
      return await prisma.expense.update({
        where: { id: params.id },
        data: {
          date: new Date(date),
          expenseType: expenseType.trim(),
          amount,
          paymentType: paymentType as PaymentType,
          expenseCategory: expenseCategory as ExpenseCategory,
          remarks: remarks?.trim() || null,
        },
      })
    })

    return NextResponse.json(expense)
  } catch (error: any) {
    console.error('Update expense error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update expense' },
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
      return await prisma.expense.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}