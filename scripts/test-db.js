#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if tables exist
    const userCount = await prisma.user.count();
    console.log(`✅ Users table exists with ${userCount} records`);
    
    const customerCount = await prisma.customer.count();
    console.log(`✅ Customers table exists with ${customerCount} records`);
    
    const productCount = await prisma.product.count();
    console.log(`✅ Products table exists with ${productCount} records`);
    
    console.log('\n🎉 Database is properly set up and ready to use!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Ensure PostgreSQL is running');
    console.log('3. Run: npx prisma db push');
    console.log('4. Run: npm run db:seed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();