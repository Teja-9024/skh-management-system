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
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const summary = await handleDatabaseOperation(async () => {
      const where: any = {}

      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      // Get total expenses
      const totalExpenses = await prisma.expense.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      })

      // Get expenses by category
      const expensesByCategory = await prisma.expense.groupBy({
        by: ['expenseCategory'],
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      })

      // Get expenses by payment type
      const expensesByPaymentType = await prisma.expense.groupBy({
        by: ['paymentType'],
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      })

      // Get monthly expenses (last 12 months)
      const monthlyExpenses = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM(amount) as total,
          COUNT(*) as count
        FROM expenses
        WHERE date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month DESC
      `

      return {
        total: totalExpenses._sum.amount || 0,
        count: totalExpenses._count,
        byCategory: expensesByCategory.map(item => ({
          category: item.expenseCategory,
          total: item._sum.amount || 0,
          count: item._count,
        })),
        byPaymentType: expensesByPaymentType.map(item => ({
          paymentType: item.paymentType,
          total: item._sum.amount || 0,
          count: item._count,
        })),
        monthly: monthlyExpenses,
      }
    })

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Get expense summary error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense summary' },
      { status: 500 }
    )
  }
}