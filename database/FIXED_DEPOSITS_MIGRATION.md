# Fixed Deposits Feature - Database Migration

## Issue
The frontend was showing errors when trying to close or block fixed deposits:
- `could not find the closed_at column of fixed_deposit cache in the schema`
- `could not find the block_reason column of fixed_deposits in the schema cache`
- HTTP 500 errors on `/api/fixed-deposits/{id}/close` and `/api/fixed-deposits/{id}/block` endpoints

## Root Cause
The `fixed_deposits` table didn't exist in the database schema, and critical columns for tracking closure and blocking status were missing.

## Solution
Created a new database migration (013_add_fixed_deposits_table.sql) that adds:

### 1. Fixed Deposits Table
```sql
CREATE TABLE fixed_deposits (
  id UUID PRIMARY KEY,
  fd_code TEXT UNIQUE,
  customer_id UUID REFERENCES customers(id),
  branch_id UUID REFERENCES branches(id),
  
  -- Deposit terms
  principal_amount NUMERIC(15,2),
  interest_rate NUMERIC(8,4),
  term_months INTEGER,
  maturity_date DATE,
  
  -- Calculated fields
  total_interest NUMERIC(15,2),
  total_maturity_amount NUMERIC(15,2),
  
  -- Status & Blocking
  status TEXT CHECK (status IN ('active', 'matured', 'closed', 'blocked')),
  is_blocked BOOLEAN,
  block_reason TEXT,              ← FIX: Missing column
  blocked_at TIMESTAMPTZ,
  blocked_by UUID REFERENCES users(id),
  
  -- Closure tracking
  closed_at TIMESTAMPTZ,          ← FIX: Missing column
  closed_by UUID REFERENCES users(id),
  payout_amount NUMERIC(15,2),
  closure_reason TEXT,
  
  -- Other fields
  payout_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id)
);
```

### 2. Fixed Deposit Transactions Table
For tracking all transactions related to each FD.

### 3. Helpful Functions & Triggers
- Auto-generate FD code (e.g., FD-20260614-00001)
- Auto-update the `updated_at` timestamp
- Index creation for performance

## How to Apply This Fix

### Option 1: Using the Complete Setup Script (Recommended)
Run the complete script on your Supabase database:
```bash
# Using Supabase SQL Editor or psql
psql -U postgres -h your-database.supabase.co -d postgres -f database/COMPLETE_SETUP.sql
```

### Option 2: Using Individual Migrations
If you already have a migration system in place, run the migrations in order:
```bash
# Run all migrations including the new one
migration:run database/migrations/013_add_fixed_deposits_table.sql
```

### Option 3: Manual Migration (For Render/Other Hosts)
1. Go to your Supabase SQL Editor
2. Copy the contents of `database/migrations/013_add_fixed_deposits_table.sql`
3. Paste and execute the SQL
4. Verify the table was created successfully

## API Endpoints Now Working

Once the migration is applied, these endpoints will function correctly:

### GET /fixed-deposits
List all fixed deposits with pagination and filtering.
```javascript
GET /fixed-deposits?page=1&limit=10&search=FD-code&status=active
```

### POST /fixed-deposits
Create a new fixed deposit.
```javascript
POST /fixed-deposits
{
  "customer_id": "uuid",
  "principal_amount": 100000,
  "interest_rate": 8.5,
  "term_months": 12,
  "payout_method": "cash",
  "notes": "Optional notes"
}
```

### POST /fixed-deposits/{id}/close
Close a fixed deposit (early or at maturity).
```javascript
POST /fixed-deposits/{id}/close
{
  "payout_amount": 110000,
  "notes": "Early closure with 2% penalty"
}
```

### POST /fixed-deposits/{id}/block
Block a fixed deposit (prevents transactions).
```javascript
POST /fixed-deposits/{id}/block
{
  "reason": "Customer requested blocking"
}
```

### POST /fixed-deposits/{id}/unblock
Unblock a fixed deposit.
```javascript
POST /fixed-deposits/{id}/unblock
{
  "reason": "Customer requested unblocking"
}
```

### GET /fixed-deposits/{id}/certificate
Download FD certificate (PDF).
```javascript
GET /fixed-deposits/{id}/certificate
```

### GET /fixed-deposits/{id}/closure-certificate
Download closure certificate after FD is closed.
```javascript
GET /fixed-deposits/{id}/closure-certificate
```

## Verification

After running the migration, verify everything is working:

```sql
-- Check table creation
SELECT tablename FROM pg_tables WHERE tablename = 'fixed_deposits';

-- Check columns exist
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'fixed_deposits';

-- Verify critical columns
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'fixed_deposits' 
  AND column_name IN ('closed_at', 'block_reason')
);  -- Should return true
```

## Frontend Components Expecting This Schema

These frontend files will now work correctly:
- `src/pages/FixedDeposits.tsx` - Main fixed deposits page
- `src/components/fixed_deposits/FixedDepositFormModal.tsx` - Create FD
- `src/components/fixed_deposits/FDEarlyCloseModal.tsx` - Close FD
- `src/components/fixed_deposits/FDCustomerFormModal.tsx` - Add FD customer

## Troubleshooting

### Error: "relation 'fixed_deposits' does not exist"
- The migration hasn't been run yet
- Run the migration using one of the methods above

### Error: "column 'closed_at' does not exist"
- The migration is incomplete or didn't apply successfully
- Try running the migration again
- Check Supabase logs for SQL errors

### Error: "Failed to connect to gvc-backend-mol5.onrender.com"
- The backend API server is down
- Check the backend service health on Render dashboard
- Ensure the API is configured to use the updated database

### Fixed Deposits Page Shows "No data"
- No fixed deposits have been created yet
- Try creating a new fixed deposit using the "New Fixed Deposit" button
- Ensure you have appropriate permissions (admin or owner)

## Schema Version
- Migration: 013_add_fixed_deposits_table.sql
- Created: 2026-06-14
- Last Updated: 2026-06-14

## Related Files
- `database/migrations/013_add_fixed_deposits_table.sql` - Migration script
- `database/COMPLETE_SETUP.sql` - Complete database setup (includes this migration)
- `src/pages/FixedDeposits.tsx` - Frontend implementation
- `src/components/fixed_deposits/` - FD components
