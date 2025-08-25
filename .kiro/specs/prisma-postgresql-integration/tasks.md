# Implementation Plan

- [x] 1. Set up Prisma and PostgreSQL foundation


  - Install Prisma CLI, client, and PostgreSQL adapter packages
  - Configure database connection string and environment variables
  - Initialize Prisma schema file with basic configuration
  - _Requirements: 1.1, 7.4_

- [ ] 2. Create comprehensive database schema
  - [ ] 2.1 Define core data models in Prisma schema
    - Write User, Customer, Supplier, Product models with proper field types
    - Define enums for UserRole, PaymentType, StockStatus, etc.
    - Add timestamps and basic constraints to all models
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 8.2_

  - [ ] 2.2 Define billing and sales models
    - Create Bill and BillItem models with proper relationships
    - Implement foreign key constraints and cascade deletes
    - Add validation rules for bill numbers and amounts
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 2.3 Define purchase and inventory models
    - Create Purchase model with supplier and product relationships
    - Implement stock status tracking and quantity management
    - Add purchase price and total value calculations
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 2.4 Define expense and transaction models
    - Create Expense model with categorization and payment tracking
    - Create MoneyTransaction model with self-referencing for repayments
    - Implement transaction status and interest rate tracking
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_

- [ ] 3. Initialize database and run migrations
  - Generate and run initial Prisma migration
  - Create database seed script with sample data
  - Test database connection and basic CRUD operations
  - _Requirements: 1.1, 1.2_

- [ ] 4. Create database utility functions and Prisma client setup
  - Set up Prisma client singleton with proper configuration
  - Create database connection helper functions
  - Implement error handling for database operations
  - Write utility functions for common database patterns
  - _Requirements: 1.1, 1.4, 7.3, 7.4_



- [ ] 5. Implement authentication API endpoints
  - [ ] 5.1 Create user authentication API routes
    - Implement POST /api/auth/login with credential validation
    - Implement POST /api/auth/logout with session cleanup
    - Implement GET /api/auth/me for current user retrieval


    - Add password hashing and JWT token generation
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ] 5.2 Update auth context to use database APIs
    - Modify AuthProvider to call authentication APIs


    - Replace localStorage with secure session management
    - Implement proper error handling for auth failures
    - _Requirements: 8.1, 8.3_

- [ ] 6. Implement customer management APIs
  - [ ] 6.1 Create customer CRUD API endpoints
    - Implement GET /api/customers with pagination and search
    - Implement POST /api/customers with validation
    - Implement GET /api/customers/[id] with relationship data
    - Implement PUT and DELETE endpoints with proper error handling
    - _Requirements: 2.2, 7.1, 7.2, 7.3_



  - [ ] 6.2 Create customer service functions
    - Write customer creation and update logic with validation
    - Implement customer search and filtering functionality
    - Add customer relationship management (bills history)
    - _Requirements: 2.2, 2.3_



- [ ] 7. Implement product and supplier management APIs
  - [ ] 7.1 Create product management API endpoints
    - Implement GET /api/products with category filtering
    - Implement POST /api/products with duplicate checking
    - Implement PUT /api/products/[id] with validation


    - Add product usage tracking across bills and purchases
    - _Requirements: 3.2, 7.1, 7.2_

  - [ ] 7.2 Create supplier management API endpoints
    - Implement GET /api/suppliers with contact information
    - Implement POST /api/suppliers with validation
    - Implement supplier-product relationship tracking
    - Add supplier performance metrics calculation
    - _Requirements: 3.1, 3.2, 7.1, 7.2_

- [ ] 8. Implement billing system APIs
  - [x] 8.1 Create bill management API endpoints


    - Implement GET /api/bills with pagination, filtering, and customer joins
    - Implement POST /api/bills with item creation and total calculation
    - Implement GET /api/bills/[id] with full item and customer details
    - Add bill number auto-generation and duplicate prevention
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.2_



  - [ ] 8.2 Create bill item management logic
    - Implement bill item creation with product relationship
    - Add purchase code validation and decoding logic
    - Implement automatic total calculation for bill items
    - Add item quantity and price validation


    - _Requirements: 2.1, 2.3, 2.4_

  - [ ] 8.3 Update billing frontend to use APIs
    - Replace local state management with API calls
    - Implement proper loading states and error handling
    - Add optimistic updates for better user experience


    - Update bill display to show database relationships
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 9. Implement purchase management APIs
  - [x] 9.1 Create purchase management API endpoints


    - Implement GET /api/purchases with supplier and product joins
    - Implement POST /api/purchases with automatic product/supplier creation
    - Implement stock status updates and quantity tracking
    - Add purchase total calculation and validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.2_

  - [ ] 9.2 Update purchase frontend to use APIs
    - Replace local state with database API calls
    - Implement supplier and product selection with autocomplete
    - Add real-time stock status updates
    - Update purchase history display with relationship data
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10. Implement expense management APIs
  - [ ] 10.1 Create expense management API endpoints
    - Implement GET /api/expenses with category and date filtering
    - Implement POST /api/expenses with validation and categorization
    - Add expense total calculations and category summaries
    - Implement expense reporting with date range queries
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.2_



  - [ ] 10.2 Update expense frontend to use APIs
    - Replace local state with database API calls
    - Implement expense category filtering and search
    - Add expense total calculations from database
    - Update expense display with proper categorization
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Implement money transaction APIs
  - [ ] 11.1 Create money transaction API endpoints
    - Implement GET /api/transactions with type and status filtering
    - Implement POST /api/transactions with repayment linking
    - Add transaction summary calculations (borrowed, lent, net)



    - Implement transaction status updates and interest calculations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2_

  - [ ] 11.2 Update money transaction frontend to use APIs
    - Replace local state with database API calls
    - Implement transaction type filtering and search
    - Add real-time summary calculations from database
    - Update transaction display with repayment relationships
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Implement reporting and analytics APIs
  - [ ] 12.1 Create dashboard summary API
    - Implement GET /api/reports/dashboard with aggregated metrics
    - Calculate total sales, purchases, expenses, and profit from database
    - Add date range filtering for dashboard metrics
    - Implement real-time data updates for dashboard cards
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1_

  - [ ] 12.2 Create detailed reporting APIs
    - Implement GET /api/reports/sales with customer and product breakdowns
    - Implement GET /api/reports/purchases with supplier analysis
    - Implement GET /api/reports/expenses with category analysis
    - Add financial summary reports with profit/loss calculations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1_

  - [ ] 12.3 Update dashboard and reports frontend
    - Replace hardcoded chart data with API calls
    - Implement dynamic chart updates based on database data
    - Add report filtering and date range selection
    - Update all summary cards with real-time database calculations
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 13. Implement comprehensive error handling and validation
  - Add input validation middleware for all API endpoints
  - Implement database error handling with user-friendly messages
  - Add request logging and error tracking
  - Create error boundary components for frontend error handling
  - _Requirements: 1.4, 7.3, 7.4_

- [ ] 14. Add data migration and seeding capabilities
  - Create migration scripts for existing localStorage data
  - Implement database seeding with realistic sample data
  - Add data backup and restore functionality
  - Create database reset and cleanup utilities
  - _Requirements: 1.2, 1.3_

- [ ] 15. Implement performance optimizations
  - Add database query optimization and indexing
  - Implement API response caching for read-heavy operations
  - Add pagination for large dataset endpoints
  - Optimize database queries with proper joins and aggregations
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 16. Add comprehensive testing
  - [ ] 16.1 Create API endpoint tests
    - Write unit tests for all CRUD operations
    - Test database relationships and constraints
    - Test error handling and validation scenarios
    - Add integration tests for complete workflows
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 16.2 Create frontend integration tests
    - Test API integration with React components
    - Test error handling and loading states
    - Test data flow from database to UI
    - Add end-to-end tests for critical user journeys
    - _Requirements: 1.2, 1.3, 1.4_