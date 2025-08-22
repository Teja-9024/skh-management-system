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

    const dashboard = await handleDatabaseOperation(async () => {
      const dateFilter: any = {}
      if (fromDate || toDate) {
        if (fromDate) dateFilter.gte = new Date(fromDate)
        if (toDate) dateFilter.lte = new Date(toDate)
      }

      // Get total sales from bills
      const salesData = await prisma.bill.aggregate({
        where: fromDate || toDate ? { date: dateFilter } : {},
        _sum: {
          totalAmount: true,
        },
        _count: true,
      })

      // Get total purchases
      const purchasesData = await prisma.purchase.aggregate({
        where: fromDate || toDate ? { purchaseDate: dateFilter } : {},
        _sum: {
          totalValue: true,
        },
        _count: true,
      })

      // Get total expenses
      const expensesData = await prisma.expense.aggregate({
        where: fromDate || toDate ? { date: dateFilter } : {},
        _sum: {
          amount: true,
        },
        _count: true,
      })

      // Get borrowed money (money we received)
      const borrowedData = await prisma.moneyTransaction.aggregate({
        where: {
          transactionType: 'BORROWED',
          ...(fromDate || toDate ? { date: dateFilter } : {}),
        },
        _sum: {
          amount: true,
        },
        _count: true,
      })

      // Get lent money (money we gave)
      const lentData = await prisma.moneyTransaction.aggregate({
        where: {
          transactionType: 'LENT',
          ...(fromDate || toDate ? { date: dateFilter } : {}),
        },
        _sum: {
          amount: true,
        },
        _count: true,
      })

      // Calculate totals
      const totalSales = salesData._sum.totalAmount || 0
      const totalPurchases = purchasesData._sum.totalValue || 0
      const totalExpenses = expensesData._sum.amount || 0
      const totalBorrowed = borrowedData._sum.amount || 0
      const totalLent = lentData._sum.amount || 0

      // Calculate gross profit (sales - purchases)
      const grossProfit = totalSales - totalPurchases

      // Calculate net outstanding (borrowed - lent)
      const netOutstanding = totalBorrowed - totalLent

      // Get monthly sales data for chart (last 6 months)
      const monthlySales = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM(total_amount) as total
        FROM bills
        WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month ASC
      `

      // Get expense distribution for pie chart
      const expenseDistribution = await prisma.expense.groupBy({
        by: ['expenseCategory'],
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 5,
      })

      return {
        summary: {
          totalSales,
          totalPurchases,
          grossProfit,
          totalExpenses,
          totalBorrowed,
          marketPurchaseValue: totalPurchases, // Same as total purchases
          netOutstanding,
        },
        counts: {
          bills: salesData._count,
          purchases: purchasesData._count,
          expenses: expensesData._count,
          borrowedTransactions: borrowedData._count,
          lentTransactions: lentData._count,
        },
        charts: {
          monthlySales: monthlySales,
          expenseDistribution: expenseDistribution.map(item => ({
            category: item.expenseCategory,
            amount: item._sum.amount || 0,
          })),
        },
      }
    })

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Get dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}