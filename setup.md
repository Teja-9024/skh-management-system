# Prisma PostgreSQL Setup Guide

This guide will help you set up the Prisma PostgreSQL integration for your handloom management system.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database server
3. **npm** or **yarn** package manager

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
npm run setup
```

This will automatically:
- Install all dependencies
- Create .env file from template
- Generate Prisma client
- Push database schema
- Seed the database with sample data

### Option 2: Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up PostgreSQL Database

Create a PostgreSQL database for your application:

```sql
CREATE DATABASE handloom_db;
CREATE USER handloom_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE handloom_db TO handloom_user;
```

### 3. Configure Environment Variables

Copy the example environment file and update it with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Database
DATABASE_URL="postgresql://handloom_user:your_password@localhost:5432/handloom_db?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-make-it-long-and-random"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret-here-make-it-long-and-random"
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Push Database Schema

```bash
npm run db:push
```

### 6. Seed the Database

```bash
npm run db:seed
```

### 7. Start the Development Server

```bash
npm run dev
```

## Default Login Credentials

After seeding, you can log in with:

- **Admin**: username: `admin`, password: `admin123`
- **Worker**: username: `worker`, password: `admin123`

## Database Management

### View Database in Prisma Studio

```bash
npm run db:studio
```

### Reset Database (if needed)

```bash
npx prisma migrate reset
npm run db:seed
```

### Push Schema Changes (for development)

```bash
npm run db:push
```

## Features Implemented

✅ **Authentication System**
- Database-backed user authentication
- Role-based access control (Owner/Worker)
- Secure JWT token management

✅ **Customer Management**
- CRUD operations for customers
- Customer relationship tracking
- Bill history per customer

✅ **Product & Supplier Management**
- Dynamic product catalog
- Supplier relationship management
- Purchase history tracking

✅ **Billing System**
- Complete bill creation with items
- Customer auto-creation
- Purchase code validation
- Payment tracking

✅ **Purchase Management**
- Inventory purchase recording
- Supplier and product auto-creation
- Stock status tracking

✅ **Expense Management**
- Categorized expense tracking
- Payment method recording
- Expense summaries and analytics

✅ **Dynamic Dashboard**
- Real-time business metrics
- Interactive charts with actual data
- Monthly sales trends
- Expense distribution analysis

✅ **Money Transaction Tracking**
- Borrowed/lent money management
- Transaction relationships
- Outstanding balance calculations

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/[id]` - Get supplier details
- `PUT /api/suppliers/[id]` - Update supplier
- `DELETE /api/suppliers/[id]` - Delete supplier

### Bills
- `GET /api/bills` - List bills
- `POST /api/bills` - Create bill
- `GET /api/bills/[id]` - Get bill details
- `PUT /api/bills/[id]` - Update bill
- `DELETE /api/bills/[id]` - Delete bill

### Purchases
- `GET /api/purchases` - List purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/[id]` - Get purchase details
- `PUT /api/purchases/[id]` - Update purchase
- `DELETE /api/purchases/[id]` - Delete purchase

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Get expense details
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense
- `GET /api/expenses/summary` - Get expense summary

### Reports
- `GET /api/reports/dashboard` - Dashboard summary data

## Troubleshooting

### Prisma Client Issues

If you get "Cannot read properties of undefined (reading 'bind')" error:

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists and user has permissions

```bash
# Test database connection
npx prisma db push
```

### Version Mismatch Issues

If you encounter version conflicts:

```bash
# Clean install with correct versions
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Migration Issues

```bash
# Reset and recreate database
npm run db:reset
npm run db:seed
```

### Seed Issues

```bash
# Clear and re-seed database
npx prisma migrate reset --force
npm run db:seed
```

### Authentication Issues

If login fails:

1. Ensure database is seeded with users
2. Check that bcryptjs is installed
3. Verify JWT_SECRET is set in .env

```bash
# Re-seed database with users
npm run db:seed
```

## Next Steps

1. **Customize the application** to match your specific business needs
2. **Add more features** like inventory management, advanced reporting
3. **Deploy to production** with proper environment configuration
4. **Set up backups** for your PostgreSQL database
5. **Configure SSL** for production database connections

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your database connection
3. Ensure all environment variables are set correctly
4. Check that all dependencies are installed

The application now has a complete database backend with all the features working dynamically!