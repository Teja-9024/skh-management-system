import { prisma } from './prisma'

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    console.error('Database operation failed:', error)
    
    if (error.code === 'P2002') {
      throw new DatabaseError('A record with this information already exists')
    }
    
    if (error.code === 'P2025') {
      throw new DatabaseError('Record not found')
    }
    
    if (error.code === 'P2003') {
      throw new DatabaseError('Related record not found')
    }
    
    throw new DatabaseError('Database operation failed')
  }
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN').format(date)
}