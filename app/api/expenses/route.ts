import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDatabaseOperation } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'
import { PaymentType, ExpenseCategory } from '@prisma/client'

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
    const category = searchParams.get('category')

    const skip = (page - 1) * limit

    const expenses = await handleDatabaseOperation(async () => {
      const where: any = {}

      if (search) {
        where.OR = [
          { expenseType: { contains: search, mode: 'insensitive' as const } },
          { remarks: { contains: search, mode: 'insensitive' as const } },
        ]
      }

      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      if (category) {
        where.expenseCategory = category as ExpenseCategory
      }

      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          // skip,
          // take: limit,
          orderBy: { date: 'desc' },
        }),
        prisma.expense.count({ where }),
      ])

      return { expenses, total, page, limit }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
      date,
      expenseType,
      amount,
      paymentType,
      expenseCategory,
      employeeName,
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
      return await prisma.expense.create({
        data: {
          date: new Date(date),
          expenseType: expenseType.trim(),
          amount,
          employeeName: employeeName?.trim() || null,
          paymentType: paymentType as PaymentType,
          expenseCategory: expenseCategory as ExpenseCategory,
          remarks: remarks?.trim() || null,
        },
      })
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error: any) {
    console.error('Create expense error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    )
  }
}