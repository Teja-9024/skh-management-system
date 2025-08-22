# Design Document

## Overview

This design outlines the integration of Prisma ORM with PostgreSQL database for the handloom business management system. The solution will replace the current localStorage-based data persistence with a robust database-backed API architecture, ensuring data integrity, relationships, and scalability.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    A[Next.js Frontend] --> B[API Routes]
    B --> C[Prisma Client]
    C --> D[PostgreSQL Database]
    
    subgraph "Frontend Layer"
        A1[React Components]
        A2[Context Providers]
        A3[Custom Hooks]
    end
    
    subgraph "API Layer"
        B1[/api/bills]
        B2[/api/purchases]
        B3[/api/expenses]
        B4[/api/transactions]
        B5[/api/reports]
        B6[/api/auth]
    end
    
    subgraph "Database Layer"
        D1[Users Table]
        D2[Customers Table]
        D3[Bills Table]
        D4[BillItems Table]
        D5[Products Table]
        D6[Suppliers Table]
        D7[Purchases Table]
        D8[Expenses Table]
        D9[MoneyTransactions Table]
    end
    
    A --> A1
    A --> A2
    A --> A3
    B --> B1
    B --> B2
    B --> B3
    B --> B4
    B --> B5
    B --> B6
    D --> D1
    D --> D2
    D --> D3
    D --> D4
    D --> D5
    D --> D6
    D --> D7
    D --> D8
    D --> D9
```

### Database Schema Design

The database will be designed with proper normalization and relationships to support all business operations:

#### Core Entities
- **Users**: Authentication and role management
- **Customers**: Customer information for billing
- **Suppliers**: Supplier information for purchases
- **Products**: Product catalog with pricing
- **Bills**: Sales transactions
- **BillItems**: Individual items in bills
- **Purchases**: Inventory purchases
- **Expenses**: Business expenses
- **MoneyTransactions**: Borrowed/lent money tracking

#### Relationships
- One-to-Many: Customer → Bills, Supplier → Purchases, Bill → BillItems
- Many-to-Many: Products ↔ Suppliers (through Purchases)
- Self-referencing: MoneyTransactions (for repayments)

## Components and Interfaces

### Prisma Schema Structure

```prisma
// User management
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Customer management
model Customer {
  id          String @id @default(cuid())
  name        String
  mobile      String?
  address     String?
  bills       Bill[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Supplier management
model Supplier {
  id          String     @id @default(cuid())
  name        String
  contactInfo String?
  purchases   Purchase[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

// Product catalog
model Product {
  id          String     @id @default(cuid())
  name        String
  category    String?
  billItems   BillItem[]
  purchases   Purchase[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

// Bills and billing
model Bill {
  id              String    @id @default(cuid())
  billNumber      String    @unique
  date            DateTime
  customerId      String
  customer        Customer  @relation(fields: [customerId], references: [id])
  sellerName      String?
  items           BillItem[]
  savingBalance   Float     @default(0)
  cashPayment     Float     @default(0)
  onlinePayment   Float     @default(0)
  borrowedAmount  Float     @default(0)
  totalAmount     Float
  remarks         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model BillItem {
  id            String  @id @default(cuid())
  billId        String
  bill          Bill    @relation(fields: [billId], references: [id], onDelete: Cascade)
  productId     String
  product       Product @relation(fields: [productId], references: [id])
  quantity      Int
  salePrice     Float
  purchaseCode  String
  total         Float
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Purchase management
model Purchase {
  id            String   @id @default(cuid())
  purchaseDate  DateTime
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  supplierId    String
  supplier      Supplier @relation(fields: [supplierId], references: [id])
  purchasePrice Float
  quantity      Int
  stockStatus   StockStatus
  totalValue    Float
  paymentType   PaymentType
  borrowedAmount Float   @default(0)
  remarks       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Expense tracking
model Expense {
  id              String        @id @default(cuid())
  date            DateTime
  expenseType     String
  amount          Float
  paymentType     PaymentType
  expenseCategory ExpenseCategory
  remarks         String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

// Money transaction tracking
model MoneyTransaction {
  id                  String            @id @default(cuid())
  transactionType     TransactionType
  date                DateTime
  amount              Float
  paymentMethod       PaymentType
  destination         String
  personName          String
  contactInfo         String?
  primaryPurpose      String
  expectedReturnDate  DateTime?
  interestRate        Float             @default(0)
  interestType        InterestType
  status              TransactionStatus
  detailedDescription String?
  parentTransactionId String?           // For linking repayments
  parentTransaction   MoneyTransaction? @relation("TransactionRepayments", fields: [parentTransactionId], references: [id])
  repayments          MoneyTransaction[] @relation("TransactionRepayments")
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
}

// Enums
enum UserRole {
  OWNER
  WORKER
}

enum StockStatus {
  AVAILABLE
  OUT_OF_STOCK
  LOW_STOCK
  ORDERED
}

enum PaymentType {
  CASH
  CARD
  UPI
  BANK_TRANSFER
  CHEQUE
}

enum ExpenseCategory {
  RENT
  ELECTRICITY
  WATER
  INTERNET
  PHONE
  TRANSPORTATION
  OFFICE_SUPPLIES
  MARKETING
  MAINTENANCE
  INSURANCE
  OTHER
}

enum TransactionType {
  BORROWED
  LENT
  REPAYMENT
}

enum InterestType {
  NO_INTEREST
  SIMPLE_INTEREST
  COMPOUND_INTEREST
  FIXED_RATE
}

enum TransactionStatus {
  ACTIVE
  COMPLETED
  OVERDUE
  PARTIAL_PAYMENT
}
```

### API Endpoints Design

#### Authentication APIs
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Customer Management APIs
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

#### Billing APIs
- `GET /api/bills` - List bills with pagination and filters
- `POST /api/bills` - Create new bill
- `GET /api/bills/[id]` - Get bill details with items
- `PUT /api/bills/[id]` - Update bill
- `DELETE /api/bills/[id]` - Delete bill

#### Purchase Management APIs
- `GET /api/purchases` - List purchases with filters
- `POST /api/purchases` - Create new purchase
- `GET /api/purchases/[id]` - Get purchase details
- `PUT /api/purchases/[id]` - Update purchase
- `DELETE /api/purchases/[id]` - Delete purchase

#### Product Management APIs
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

#### Supplier Management APIs
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/[id]` - Get supplier details
- `PUT /api/suppliers/[id]` - Update supplier
- `DELETE /api/suppliers/[id]` - Delete supplier

#### Expense Management APIs
- `GET /api/expenses` - List expenses with filters
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/[id]` - Get expense details
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

#### Money Transaction APIs
- `GET /api/transactions` - List money transactions with filters
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/[id]` - Get transaction details
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction
- `GET /api/transactions/summary` - Get financial summary

#### Reporting APIs
- `GET /api/reports/dashboard` - Dashboard summary data
- `GET /api/reports/sales` - Sales reports with date filters
- `GET /api/reports/purchases` - Purchase reports with filters
- `GET /api/reports/expenses` - Expense reports with filters
- `GET /api/reports/financial` - Financial summary reports

## Data Models

### Request/Response Models

#### Bill Creation Request
```typescript
interface CreateBillRequest {
  billNumber: string
  date: string
  customer: {
    name: string
    mobile?: string
  }
  sellerName?: string
  items: {
    productName: string
    quantity: number
    salePrice: number
    purchaseCode: string
  }[]
  savingBalance?: number
  cashPayment?: number
  onlinePayment?: number
  borrowedAmount?: number
  remarks?: string
}
```

#### Purchase Creation Request
```typescript
interface CreatePurchaseRequest {
  purchaseDate: string
  product: {
    name: string
    category?: string
  }
  supplier: {
    name: string
    contactInfo?: string
  }
  purchasePrice: number
  quantity: number
  stockStatus: StockStatus
  paymentType: PaymentType
  borrowedAmount?: number
  remarks?: string
}
```

#### Expense Creation Request
```typescript
interface CreateExpenseRequest {
  date: string
  expenseType: string
  amount: number
  paymentType: PaymentType
  expenseCategory: ExpenseCategory
  remarks?: string
}
```

#### Money Transaction Request
```typescript
interface CreateTransactionRequest {
  transactionType: TransactionType
  date: string
  amount: number
  paymentMethod: PaymentType
  destination: string
  personName: string
  contactInfo?: string
  primaryPurpose: string
  expectedReturnDate?: string
  interestRate?: number
  interestType: InterestType
  status: TransactionStatus
  detailedDescription?: string
  parentTransactionId?: string
}
```

## Error Handling

### Database Error Handling
- Connection errors: Retry logic with exponential backoff
- Constraint violations: Return specific validation errors
- Transaction failures: Proper rollback and error reporting
- Query timeouts: Implement query optimization and caching

### API Error Responses
```typescript
interface ApiError {
  error: string
  message: string
  statusCode: number
  details?: any
}
```

### Error Categories
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (duplicate data)
- 500: Internal Server Error (database/server issues)

## Testing Strategy

### Unit Testing
- Prisma model validation
- API endpoint logic
- Business rule validation
- Error handling scenarios

### Integration Testing
- Database operations with test database
- API endpoint integration
- Authentication flow
- Data relationship integrity

### End-to-End Testing
- Complete user workflows
- Cross-module data consistency
- Performance under load
- Data migration scenarios

### Test Data Management
- Seed scripts for development
- Test fixtures for automated testing
- Data cleanup procedures
- Mock data generation

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Query optimization with Prisma
- Connection pooling configuration
- Database query monitoring

### API Performance
- Response caching for read-heavy operations
- Pagination for large datasets
- Efficient data serialization
- Request rate limiting

### Frontend Integration
- Optimistic updates for better UX
- Data prefetching strategies
- Error boundary implementation
- Loading state management

## Security Considerations

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control
- Session management
- Password security best practices

### Data Protection
- Input validation and sanitization
- SQL injection prevention (Prisma handles this)
- XSS protection
- CSRF protection

### API Security
- Rate limiting
- Request validation
- Error message sanitization
- Audit logging