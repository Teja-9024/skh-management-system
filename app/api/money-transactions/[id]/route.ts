import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDatabaseOperation } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'
type Params = Promise<{ id: string }>

export async function DELETE(request: NextRequest  , segmentData: { params: Params }) {
  try {
   
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await segmentData.params
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    await handleDatabaseOperation(async () => {
      await prisma.moneyTransaction.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'Transaction deleted' , success:true})
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
