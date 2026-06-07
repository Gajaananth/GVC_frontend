# Finance Management System - Implementation Guide

## Overview

This document provides a comprehensive guide to the Finance Management System with complete branch and role-based structure as requested.

## System Architecture

### Organization Hierarchy
```
Owner
  ├── Branch
  │   ├── Branch Manager (1 per branch)
  │   ├── Admin
  │   ├── Cashier
  │   └── Staff (Collection Officers)
  ├── Branch
  │   └── ...
```

### Key Features Implemented

1. **Branch Management**
   - Create, edit, disable branches
   - Automatic branch status management
   - One branch manager per branch (enforced by DB constraint + trigger)

2. **Role-Based Access Control**
   - Owner: Full system access
   - Branch Manager: Branch-only access + can reject loans before owner review
   - Admin: Same as Cashier
   - Cashier: Same as Admin
   - Staff: Collection officer only (assigned customers only)

3. **Loan Approval Workflow**
   - Admin/Cashier creates loan
   - If branch has manager:
     - Pending Manager Review → Manager can forward or reject
     - If forwarded → Pending Owner Approval
   - If no manager: Pending Owner Approval
   - Owner makes final approval/rejection

4. **Face Detection Validation**
   - Validates customer face photos
   - Checks: exactly 1 face, clear, not cropped, not too dark/bright
   - All three documents mandatory (face, NIC front, NIC back)

5. **Branch Data Isolation**
   - Owner: sees all branches
   - Branch staff: sees only own branch
   - Staff: sees only assigned customers
   - Enforced in API queries

6. **Activity Logging**
   - Logs all CRUD operations
   - Includes: user, role, branch, action, record type, record ID
   - Accessible based on role/branch permissions

## Database Structure

### Key Tables

```sql
branches
  id, branch_code, branch_name, address, phone, email, status, created_at, updated_at

users
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, ...
  -- role IN ('owner', 'branch_manager', 'admin', 'cashier', 'staff')
  -- constraint: owner has NULL branch_id, others have NOT NULL branch_id
  -- constraint: unique branch_manager per branch

customers
  id, customer_code, full_name, nic_number, phone, email, address, branch_id, ...
  photo_url, nic_front_url, nic_back_url, assigned_staff_id, ...

loans
  id, loan_code, customer_id, branch_id, applied_by, approval_status, ...
  approval_status IN ('pending_manager_review', 'pending_owner_approval', 'approved', 'rejected')
  manager_reviewed_by, manager_reviewed_at, manager_review_notes

customer_documents
  id, customer_id, branch_id, document_type, file_url
  face_detected, face_count, face_quality_score, validation_status

activity_logs
  id, user_id, user_name, user_role, branch_id, action, record_type, record_id, created_at
```

### Database Migrations

**Migration 011**: `011_complete_branch_role_system.sql`
- Add branch status field
- Ensure single branch manager per branch (trigger + constraint)
- Add loan approval workflow fields
- Create customer_documents table
- Add activity logging fields
- Create helper functions

**Migration 012**: `012_seed_demo_data.sql`
- Create 4 demo branches (Ampara, Kalmunai, Batticaloa, Akkaraipattu)
- Create owner user
- Create one branch manager per branch
- Create demo admin, cashier, and staff users
- Create demo customers

## Frontend Services

### Services Implemented

1. **branchService.ts**
   - Get all branches
   - Create/update branches
   - Get/assign branch manager
   - Get branch statistics

2. **userService.ts**
   - Login/logout
   - Get current user
   - Create users with branch validation
   - Promote to branch manager (auto-demotes existing)
   - Demote from branch manager
   - Transfer to different branch

3. **customerService.ts**
   - Get customers (branch-filtered)
   - Create customers (all 3 docs required)
   - Upload and validate documents
   - Validate face photos
   - Assign customers to staff

4. **loanService.ts**
   - Create loans with correct approval workflow
   - Branch manager review (forward/reject)
   - Owner approval/rejection
   - Get pending approvals

5. **paymentService.ts**
   - Record payments
   - Get payment history
   - Print receipts

6. **activityLogService.ts**
   - Query activity logs with filters
   - Branch-based filtering

### Utility Functions

1. **rolePermissions.ts**
   - Complete permission matrix for all roles
   - `hasPermission(role, permission)` function
   - Defines 30+ permission types

2. **faceDetection.ts**
   - Validate face photos (client-side prep)
   - Check for 1 face, clear image, not cropped, etc.
   - Return validation result with error messages

## API Endpoints Specification

All endpoints documented in `API_ENDPOINTS.md`

### Key Endpoints

**Authentication**
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

**Branches**
- GET/POST /api/branches
- GET/PUT /api/branches/:branchId
- POST /api/branches/:branchId/manager (with auto-demotion logic)

**Users**
- GET/POST /api/users
- PUT/DELETE /api/users/:userId
- POST /api/users/:userId/promote (to manager, auto-demote existing)
- POST /api/users/:userId/transfer (to branch)

**Customers**
- GET/POST /api/customers
- POST /api/customers/:customerId/documents (upload + validate)
- POST /api/customers/:customerId/validate-face (server-side validation)
- POST /api/customers/:customerId/assign (to staff)

**Loans**
- POST /api/loans (routes based on manager existence)
- POST /api/loans/:loanId/manager-review (forward/reject)
- POST /api/loans/:loanId/approve (owner only)
- POST /api/loans/:loanId/reject

**Payments**
- POST /api/payments
- GET /api/payments, /api/loans/:loanId/payments

**Activity Logs**
- GET /api/activity-logs (with branch filtering)

## Role Permissions Matrix

### Owner
- ✅ All permissions
- Access: All branches, all data
- Can: Create/manage branches, create users, approve loans, configure system

### Branch Manager
- ✅ Branch-only access
- Can: View/create customers, loans, payments
- Can: Review loans (forward/reject), cannot final approve
- Can: Create admin/cashier/staff
- Cannot: Access other branches, configure system

### Admin
- ✅ Branch-only access (same as Cashier)
- Can: Create/manage customers, create loans, record payments
- Cannot: Approve loans, create users

### Cashier
- ✅ Branch-only access (same as Admin)
- Can: Same as Admin

### Staff
- ✅ Assigned customers only
- Can: View assigned customers, record payments/collections
- Cannot: Create customers, create loans

## Loan Approval Workflow

### Scenario 1: Branch WITH Manager
```
Create Loan (Admin/Cashier/Manager)
  ↓
approval_status = "pending_manager_review"
  ↓
Branch Manager Reviews
  - Forward → approval_status = "pending_owner_approval"
  - Reject → approval_status = "rejected"
  ↓
Owner Approves/Rejects
  - Approve → approval_status = "approved", status = "active"
  - Reject → approval_status = "rejected"
```

### Scenario 2: Branch WITHOUT Manager
```
Create Loan (Admin/Cashier)
  ↓
approval_status = "pending_owner_approval"
  ↓
Owner Approves/Rejects
  - Approve → approval_status = "approved", status = "active"
  - Reject → approval_status = "rejected"
```

## Face Detection Validation

### Requirements
- ✅ Exactly 1 face detected
- ✅ Face quality score ≥ 0.6
- ✅ Image clear (not blurry)
- ✅ Not cropped
- ✅ Not too dark
- ✅ Not too bright
- ✅ Face not hidden

### Implementation
- Client-side: Basic validation in `faceDetection.ts`
- Server-side: Face detection API integration (to be implemented)
- Rejection: Display specific error message

## Branch Data Isolation

### Query Filtering Rules

```
Owner:
  - Query all data without filtering

BranchManager/Admin/Cashier:
  - WHERE branch_id = current_user.branch_id

Staff:
  - WHERE assigned_customer_id IN (assigned_to_user)
  - Cannot query other staff's customers
```

### Implementation Points
- All customer queries filter by branch_id
- All loan queries filter by branch_id
- All payment queries filter by branch_id
- All activity logs filter by branch_id (except owner)
- JOIN user role with auth to verify branch access

## Activity Logging

### Logged Events
- Customer Created/Updated/Deleted
- Loan Created/Forwarded/Approved/Rejected
- Payment Added
- Deposit Added
- Withdrawal Added
- User Created/Updated/Deleted/Promoted/Demoted/Transferred
- Branch Manager Assigned/Removed

### Log Fields
```
activity_logs {
  id: UUID
  user_id: UUID
  user_name: string
  user_role: string
  branch_id: UUID
  action: string (e.g., "Customer Created")
  record_type: string (e.g., "customer")
  record_id: UUID
  created_at: timestamp
}
```

## Testing Strategy

### Unit Tests
- [ ] Branch manager constraint
- [ ] Permission checks
- [ ] Face detection validation
- [ ] Loan workflow routing

### Integration Tests
- [ ] Complete customer registration flow
- [ ] Loan approval workflow with manager
- [ ] Loan approval workflow without manager
- [ ] Payment recording and balance update
- [ ] Branch data isolation

### Manual Testing
- Login with each role
- Create customer with documents
- Create loan and follow approval workflow
- Record payment
- Check activity logs
- Verify data isolation

## Deployment

### 1. Database Setup
```bash
# Apply migrations
psql -U postgres -d gvc_finance < migrations/011_complete_branch_role_system.sql
psql -U postgres -d gvc_finance < migrations/012_seed_demo_data.sql
```

### 2. Backend Deployment
- Implement all endpoints from API_ENDPOINTS.md
- Implement role-based middleware
- Implement branch filtering in all queries
- Implement face detection API integration
- Deploy with Node.js/Express or similar

### 3. Frontend Deployment
- Build with `npm run build`
- Deploy to Vercel or similar
- Ensure API_URL environment variable points to backend

## Demo Credentials

After running seed migrations:

```
Owner:
  Email: owner@gvcagro.lk
  Password: Password@2026

Branch Manager (Ampara):
  Email: manager.ampara@gvcagro.lk
  Password: Password@2026

Admin (Ampara):
  Email: admin.ampara@gvcagro.lk
  Password: Password@2026

Cashier (Ampara):
  Email: cashier.ampara@gvcagro.lk
  Password: Password@2026

Staff 1 (Ampara):
  Email: staff.ampara1@gvcagro.lk
  Password: Password@2026

Staff 2 (Ampara):
  Email: staff.ampara2@gvcagro.lk
  Password: Password@2026
```

## Verification Checklist

- [x] Database migrations created
- [x] Seed data provided
- [x] Frontend services implemented
- [x] Role permissions defined
- [x] Face detection utility created
- [x] Customer registration component
- [x] API documentation complete
- [x] Implementation checklist created
- [ ] Backend endpoints implemented (next step)
- [ ] End-to-end testing
- [ ] Deployment

## Support & Documentation

- **API Endpoints**: See `API_ENDPOINTS.md`
- **Implementation Status**: See `IMPLEMENTATION_CHECKLIST.md`
- **Permission Rules**: See `src/utils/rolePermissions.ts`
- **Database Schema**: See `database/schema.sql`
- **Migrations**: See `database/migrations/`

## Notes

- All business rules are enforced at database level (constraints, triggers)
- Role-based access enforced at API level
- Branch filtering enforced in all queries
- Activity logging triggered automatically
- Face detection uses face-api.js library (client-side integration)
- All frontend services ready for backend implementation
