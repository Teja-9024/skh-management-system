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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    const transactions = await handleDatabaseOperation(async () => {
      const dateFilter: any = {}
      if (fromDate || toDate) {
        if (fromDate) dateFilter.gte = new Date(fromDate)
        if (toDate) dateFilter.lte = new Date(toDate)
      }

      return await prisma.moneyTransaction.findMany({
        where: fromDate || toDate ? { date: dateFilter } : {},
        orderBy: { date: 'desc' },
        take: limit,
        include: {
          parentTransaction: true,
          repayments: true,
        },
      })
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Failed to fetch money transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch money transactions' },
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

    const body = await request.json()

    console.log('Received POST body:', body)

    const transaction = await handleDatabaseOperation(async () => {
      return await prisma.moneyTransaction.create({
        data: {
          transactionType: body.transactionType,
          date: new Date(body.date),
          amount: typeof body.amount === 'number' ? body.amount : parseFloat(body.amount),
          paymentMethod: body.paymentMethod,
          destination: body.destination,
          personName: body.personName,
          contactInfo: body.contactInfo,
          primaryPurpose: body.primaryPurpose,
          expectedReturnDate: body.expectedReturnDate ? new Date(body.expectedReturnDate) : null,
          interestRate: typeof body.interestRate === 'number' ? body.interestRate : parseFloat(body.interestRate || 0),
          interestType: body.interestType,
          status: body.status,
          detailedDescription: body.detailedDescription,
          parentTransactionId: body.parentTransactionId || null,
        },
      })
    })

    return NextResponse.json({ transaction:transaction ,message: 'Transaction created successfully!' ,success:true})
  } catch (error:any) {
    console.error('Failed to create money transaction:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


