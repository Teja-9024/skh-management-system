import { PrismaClient, UserRole, PaymentType, StockStatus, ExpenseCategory, TransactionType, InterestType, TransactionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create users
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const owner = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: UserRole.OWNER,
    },
  })

  const worker = await prisma.user.upsert({
    where: { username: 'worker' },
    update: {},
    create: {
      username: 'worker',
      password: hashedPassword,
      role: UserRole.WORKER,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Created users: ${owner.username}, ${worker.username}`)

}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })