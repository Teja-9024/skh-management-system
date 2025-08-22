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

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Kumar',
      mobile: '9876543210',
      address: 'Mumbai, Maharashtra',
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Sharma',
      mobile: '9876543211',
      address: 'Delhi, India',
    },
  })

  // Create suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Cotton Mills Ltd',
      contactInfo: 'contact@cottonmills.com, 9876543212',
    },
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Silk Traders',
      contactInfo: 'info@silktraders.com, 9876543213',
    },
  })

  // Create products
  const product1 = await prisma.product.create({
    data: {
      name: 'Cotton Saree',
      category: 'Sarees',
    },
  })

  const product2 = await prisma.product.create({
    data: {
      name: 'Silk Dupatta',
      category: 'Dupatta',
    },
  })

  const product3 = await prisma.product.create({
    data: {
      name: 'Handloom Fabric',
      category: 'Fabric',
    },
  })

  // Create purchases
  await prisma.purchase.create({
    data: {
      purchaseDate: new Date('2024-01-15'),
      productId: product1.id,
      supplierId: supplier1.id,
      purchasePrice: 800,
      quantity: 10,
      stockStatus: StockStatus.AVAILABLE,
      totalValue: 8000,
      paymentType: PaymentType.CASH,
      remarks: 'High quality cotton sarees',
    },
  })

  await prisma.purchase.create({
    data: {
      purchaseDate: new Date('2024-01-20'),
      productId: product2.id,
      supplierId: supplier2.id,
      purchasePrice: 1200,
      quantity: 5,
      stockStatus: StockStatus.AVAILABLE,
      totalValue: 6000,
      paymentType: PaymentType.UPI,
      remarks: 'Premium silk dupatta',
    },
  })

  // Create bills
  const bill1 = await prisma.bill.create({
    data: {
      billNumber: '001',
      date: new Date('2024-01-25'),
      customerId: customer1.id,
      sellerName: 'Shop Owner',
      savingBalance: 0,
      cashPayment: 1500,
      onlinePayment: 0,
      borrowedAmount: 0,
      totalAmount: 1500,
      remarks: 'First sale of the month',
    },
  })

  await prisma.billItem.create({
    data: {
      billId: bill1.id,
      productId: product1.id,
      quantity: 1,
      salePrice: 1500,
      purchaseCode: 'DIN',
      total: 1500,
    },
  })

  // Create expenses
  await prisma.expense.create({
    data: {
      date: new Date('2024-01-10'),
      expenseType: 'Monthly Rent',
      amount: 15000,
      paymentType: PaymentType.BANK_TRANSFER,
      expenseCategory: ExpenseCategory.RENT,
      remarks: 'Shop rent for January',
    },
  })

  await prisma.expense.create({
    data: {
      date: new Date('2024-01-12'),
      expenseType: 'Electricity Bill',
      amount: 3500,
      paymentType: PaymentType.UPI,
      expenseCategory: ExpenseCategory.ELECTRICITY,
      remarks: 'Monthly electricity bill',
    },
  })

  // Create money transactions
  await prisma.moneyTransaction.create({
    data: {
      transactionType: TransactionType.BORROWED,
      date: new Date('2024-01-05'),
      amount: 50000,
      paymentMethod: PaymentType.CASH,
      destination: 'Individual Person',
      personName: 'Dinesh Kumar',
      contactInfo: '9876543214',
      primaryPurpose: 'Business Expansion',
      expectedReturnDate: new Date('2024-06-05'),
      interestRate: 12,
      interestType: InterestType.SIMPLE_INTEREST,
      status: TransactionStatus.ACTIVE,
      detailedDescription: 'Borrowed money for expanding the business',
    },
  })

  await prisma.moneyTransaction.create({
    data: {
      transactionType: TransactionType.LENT,
      date: new Date('2024-01-08'),
      amount: 25000,
      paymentMethod: PaymentType.BANK_TRANSFER,
      destination: 'Individual Person',
      personName: 'Suresh Patel',
      contactInfo: '9876543215',
      primaryPurpose: 'Personal Use',
      expectedReturnDate: new Date('2024-04-08'),
      interestRate: 10,
      interestType: InterestType.SIMPLE_INTEREST,
      status: TransactionStatus.ACTIVE,
      detailedDescription: 'Lent money to friend for personal use',
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Created users: ${owner.username}, ${worker.username}`)
  console.log(`👥 Created customers: ${customer1.name}, ${customer2.name}`)
  console.log(`🏭 Created suppliers: ${supplier1.name}, ${supplier2.name}`)
  console.log(`📦 Created products: ${product1.name}, ${product2.name}, ${product3.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })