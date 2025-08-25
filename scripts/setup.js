#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Prisma PostgreSQL integration...\n');

// Function to run commands
function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

// Function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Step 1: Install dependencies
runCommand('npm install', 'Installing dependencies');

// Step 2: Check if .env exists
if (!fileExists('.env')) {
  console.log('📝 Creating .env file from template...');
  if (fileExists('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created. Please update it with your database credentials.\n');
  } else {
    console.log('⚠️  .env.example not found. Please create .env manually.\n');
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Step 3: Generate Prisma client
runCommand('npx prisma generate', 'Generating Prisma client');

// Step 4: Check database connection and run migrations
console.log('🔍 Checking database connection...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database connection successful and schema pushed\n');
} catch (error) {
  console.log('⚠️  Database connection failed. Please check your DATABASE_URL in .env file.');
  console.log('Make sure PostgreSQL is running and the database exists.\n');
  console.log('You can create the database with:');
  console.log('CREATE DATABASE handloom_db;');
  console.log('CREATE USER handloom_user WITH PASSWORD \'your_password\';');
  console.log('GRANT ALL PRIVILEGES ON DATABASE handloom_db TO handloom_user;\n');
  process.exit(1);
}

// Step 5: Seed the database
try {
  runCommand('npm run db:seed', 'Seeding database with sample data');
} catch (error) {
  console.log('⚠️  Database seeding failed. You can run it manually later with: npm run db:seed\n');
}

console.log('🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update your .env file with correct database credentials');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:3000');
console.log('\n🔐 Default login credentials:');
console.log('Admin: username: admin, password: admin123');
console.log('Worker: username: worker, password: admin123');
console.log('\n📚 For more information, see setup.md');