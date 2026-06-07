# API Endpoints Specification

## Finance Management System - Backend API Documentation

### Authentication Endpoints

#### POST /api/auth/login
- **Description**: Login with email and password
- **Access**: Public
- **Request**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: `{ user: User, accessToken: string }`
- **Errors**: 401 Unauthorized

#### POST /api/auth/logout
- **Description**: Logout current user
- **Access**: Authenticated
- **Response**: `{ success: true }`

#### GET /api/auth/me
- **Description**: Get current authenticated user
- **Access**: Authenticated
- **Response**: `User`

---

### Branch Management Endpoints

#### GET /api/branches
- **Description**: Get all branches
- **Access**: Owner only
- **Query**: `?status=active|inactive`
- **Response**: `Branch[]`

#### GET /api/branches/:branchId
- **Description**: Get single branch details
- **Access**: Owner, BranchManager (own branch)
- **Response**: `Branch`

#### POST /api/branches
- **Description**: Create branch
- **Access**: Owner only
- **Request**: `{ branch_code, branch_name, address, phone, email }`
- **Response**: `Branch`
- **Validation**: 
  - `branch_code` must be unique
  - `branch_name` required

#### PUT /api/branches/:branchId
- **Description**: Update branch
- **Access**: Owner only
- **Request**: `{ branch_name?, address?, phone?, email?, status? }`
- **Response**: `Branch`

#### GET /api/branches/:branchId/manager
- **Description**: Get branch manager if exists
- **Access**: Owner, BranchManager
- **Response**: `BranchManager | null`

#### POST /api/branches/:branchId/manager
- **Description**: Assign manager to branch (removes existing if any)
- **Access**: Owner only
- **Request**: `{ user_id: UUID }`
- **Response**: `User`
- **Rules**:
  - Automatically removes previous manager's role
  - Only one active manager per branch
  - User must exist and belong to this branch

#### GET /api/branches/:branchId/stats
- **Description**: Get branch statistics
- **Access**: Owner, BranchManager
- **Response**: `{ active_customers, total_loans, total_outstanding, etc }`

#### GET /api/branches/:branchId/users
- **Description**: Get all users in branch
- **Access**: Owner, BranchManager, Admin
- **Query**: `?role=admin|cashier|staff`
- **Response**: `User[]`

---

### User Management Endpoints

#### GET /api/users/:userId
- **Description**: Get user details
- **Access**: Owner, user themselves, their BranchManager
- **Response**: `User`
- **Rules**: Users can only see own branch users

#### POST /api/users
- **Description**: Create new user
- **Access**: Owner (any role), BranchManager (admin/cashier/staff only)
- **Request**:
  ```json
  {
    "email": "string (unique)",
    "password": "string",
    "full_name": "string",
    "role": "branch_manager|admin|cashier|staff",
    "branch_id": "UUID (required for non-owner)",
    "mobile": "string?",
    "address": "string?"
  }
  ```
- **Response**: `User`
- **Rules**:
  - Branch selection mandatory for non-owner roles
  - Error if branch_id missing for non-owner role
  - Email must be unique

#### PUT /api/users/:userId
- **Description**: Update user
- **Access**: Owner, user themselves, their BranchManager
- **Request**: `{ full_name?, mobile?, address?, avatar_url?, is_active? }`
- **Response**: `User`

#### DELETE /api/users/:userId
- **Description**: Delete user
- **Access**: Owner only
- **Response**: `{ success: true }`

#### POST /api/users/:userId/promote
- **Description**: Promote user to Branch Manager (demotes existing manager)
- **Access**: Owner only
- **Request**: `{ new_role: "branch_manager", branch_id: UUID }`
- **Response**: `User`
- **Rules**:
  - Automatically demotes current manager to previous role
  - Only one active manager per branch

#### POST /api/users/:userId/demote
- **Description**: Demote Branch Manager to another role
- **Access**: Owner only
- **Request**: `{ new_role: "admin|cashier|staff" }`
- **Response**: `User`

#### POST /api/users/:userId/transfer
- **Description**: Transfer user to another branch
- **Access**: Owner only
- **Request**: `{ branch_id: UUID }`
- **Response**: `User`
- **Rules**:
  - If user is manager, automatically demote after transfer
  - Target branch cannot have active manager if user is manager

#### POST /api/users/:userId/deactivate
- **Description**: Deactivate user
- **Access**: Owner, BranchManager
- **Response**: `User`

#### POST /api/users/:userId/reactivate
- **Description**: Reactivate user
- **Access**: Owner
- **Response**: `User`

---

### Customer Management Endpoints

#### GET /api/customers
- **Description**: Get customers (branch-filtered for non-owners)
- **Access**: Owner, Admin, Cashier, BranchManager
- **Query**: `?branch_id=UUID&name=string&nic=string&status=active|inactive`
- **Response**: `Customer[]`
- **Rules**: Non-owners only see branch customers

#### GET /api/customers/:customerId
- **Description**: Get customer details
- **Access**: Owner, branch users, assigned staff
- **Response**: `Customer`

#### POST /api/customers
- **Description**: Create customer
- **Access**: Owner, BranchManager, Admin, Cashier
- **Request**:
  ```json
  {
    "full_name": "string",
    "nic_number": "string",
    "phone": "string",
    "address": "string",
    "branch_id": "UUID",
    "photo_url": "string (required)",
    "nic_front_url": "string (required)",
    "nic_back_url": "string (required)",
    "email": "string?",
    "date_of_birth": "date?",
    "gender": "male|female|other?",
    "occupation": "string?",
    "monthly_income": "number?"
  }
  ```
- **Response**: `Customer`
- **Rules**:
  - All three document URLs mandatory: photo_url, nic_front_url, nic_back_url
  - Face photo must pass validation (exactly 1 face, clear, etc)
  - NIC number must be unique
  - Phone must be unique

#### PUT /api/customers/:customerId
- **Description**: Update customer
- **Access**: Owner, BranchManager, Admin, Cashier
- **Request**: `{ full_name?, phone?, email?, address?, occupation?, monthly_income?, is_active? }`
- **Response**: `Customer`

#### POST /api/customers/:customerId/documents
- **Description**: Upload and validate customer documents
- **Access**: Owner, BranchManager, Admin, Cashier
- **Content-Type**: multipart/form-data
- **Request**:
  - `document_type`: "face_photo" | "nic_front" | "nic_back"
  - `file`: File
- **Response**: `{ file_url: string, validation_status: string, face_detected?: boolean }`
- **Rules**:
  - Face photo: validate with face detection
  - NIC images: basic validation only
  - Return validation status

#### POST /api/customers/:customerId/validate-face
- **Description**: Validate face detection on face photo
- **Access**: Owner, BranchManager, Admin, Cashier
- **Request**: `{ photo_url: string }`
- **Response**: `FaceDetectionResult`
- **Face Validation Rules**:
  - Exactly 1 face detected
  - Face quality score >= 0.6
  - Not cropped
  - Not too dark / too bright
  - Face not hidden
  - Image clear

#### POST /api/customers/:customerId/assign
- **Description**: Assign customer to staff member
- **Access**: Owner, BranchManager, Admin
- **Request**: `{ staff_id: UUID }`
- **Response**: `Customer`

#### GET /api/staff/:staffId/customers
- **Description**: Get assigned customers for staff
- **Access**: Staff themselves, BranchManager, Owner
- **Response**: `Customer[]`

#### GET /api/customers/:customerId/portfolio
- **Description**: Get customer's loans and savings
- **Access**: Owner, branch users, assigned staff
- **Response**: `{ loans: [], savings_accounts: [] }`

#### POST /api/customers/:customerId/deactivate
- **Description**: Deactivate customer
- **Access**: Owner, BranchManager, Admin
- **Response**: `Customer`

---

### Loan Management Endpoints

#### GET /api/loans
- **Description**: Get loans (branch-filtered)
- **Access**: Owner (all), others (branch only)
- **Query**: `?branch_id=UUID&approval_status=pending_manager_review|pending_owner_approval|approved|rejected&customer_id=UUID`
- **Response**: `Loan[]`

#### GET /api/loans/:loanId
- **Description**: Get loan details
- **Access**: Owner, branch users
- **Response**: `Loan`

#### POST /api/loans
- **Description**: Create loan application
- **Access**: Owner, BranchManager, Admin, Cashier
- **Request**:
  ```json
  {
    "customer_id": "UUID",
    "branch_id": "UUID",
    "principal_amount": "number",
    "interest_rate": "number (% e.g., 2.5)",
    "interest_type": "daily|monthly",
    "duration_months": "number",
    "start_date": "date",
    "loan_application_url": "string (PDF URL required)",
    "purpose": "string?",
    "guarantor_name": "string?",
    "guarantor_phone": "string?"
  }
  ```
- **Response**: `Loan`
- **Rules**:
  - Loan application PDF mandatory
  - Branch must exist
  - Customer must exist
  - Approval status determined by branch:
    - Has Manager: "pending_manager_review"
    - No Manager: "pending_owner_approval"

#### PUT /api/loans/:loanId
- **Description**: Update loan
- **Access**: Owner, BranchManager (before approval)
- **Request**: `{ ... }`
- **Response**: `Loan`

#### POST /api/loans/:loanId/manager-review
- **Description**: Branch manager reviews loan
- **Access**: BranchManager only
- **Request**:
  ```json
  {
    "action": "forward|reject",
    "notes": "string?"
  }
  ```
- **Response**: `Loan`
- **Rules**:
  - "forward" → approval_status = "pending_owner_approval"
  - "reject" → approval_status = "rejected"

#### POST /api/loans/:loanId/approve
- **Description**: Owner approves loan (final)
- **Access**: Owner only
- **Response**: `Loan`
- **Rules**:
  - Only Owner can approve
  - Sets approval_status = "approved"
  - Sets status = "active"
  - Creates loan schedule

#### POST /api/loans/:loanId/reject
- **Description**: Reject loan
- **Access**: Owner, BranchManager (before owner sees it)
- **Request**: `{ rejection_reason: string }`
- **Response**: `Loan`
- **Rules**:
  - Sets approval_status = "rejected"

#### GET /api/loans/pending
- **Description**: Get pending approvals
- **Access**: Owner (all), BranchManager (manager review in branch)
- **Query**: `?branch_id=UUID&approval_status=pending_manager_review|pending_owner_approval`
- **Response**: `Loan[]`

#### GET /api/loans/:loanId/schedule
- **Description**: Get loan installment schedule
- **Access**: Owner, branch users
- **Response**: `LoanScheduleItem[]`

#### GET /api/loans/:loanId/payments
- **Description**: Get loan payments
- **Access**: Owner, branch users
- **Response**: `Payment[]`

#### GET /api/customers/:customerId/loans
- **Description**: Get customer loans
- **Access**: Owner, branch users, customer's assigned staff
- **Response**: `Loan[]`

---

### Payment Management Endpoints

#### POST /api/payments
- **Description**: Record payment
- **Access**: Owner, BranchManager, Admin, Cashier, Staff
- **Request**:
  ```json
  {
    "loan_id": "UUID",
    "amount": "number",
    "payment_type": "regular|partial|full_settlement|advance",
    "payment_method": "cash|bank_transfer|cheque|mobile",
    "payment_date": "date",
    "reference_number": "string?",
    "notes": "string?"
  }
  ```
- **Response**: `Payment`
- **Rules**:
  - Updates loan remaining_balance
  - Updates loan status if fully paid
  - Auto-populate branch_id from customer

#### GET /api/payments
- **Description**: Get payments (branch-filtered)
- **Access**: Owner, branch users
- **Query**: `?branch_id=UUID&loan_id=UUID&customer_id=UUID`
- **Response**: `Payment[]`

#### GET /api/loans/:loanId/payments
- **Description**: Get payments for loan
- **Access**: Owner, branch users
- **Response**: `Payment[]`

#### GET /api/customers/:customerId/payments
- **Description**: Get payments for customer
- **Access**: Owner, branch users, assigned staff
- **Response**: `Payment[]`

#### GET /api/payments/:paymentId
- **Description**: Get payment details
- **Access**: Owner, payment creator, branch users
- **Response**: `Payment`

#### GET /api/payments/:paymentId/receipt
- **Description**: Download receipt (PDF)
- **Access**: Owner, payment creator, branch users
- **Response**: PDF blob

#### GET /api/staff/:staffId/daily-collection
- **Description**: Get staff daily collection summary
- **Access**: Staff themselves, BranchManager, Owner
- **Query**: `?date=YYYY-MM-DD`
- **Response**: `{ total_collected: number, payment_count: number, payments: [] }`

---

### Activity Logging Endpoints

#### GET /api/activity-logs
- **Description**: Get activity logs
- **Access**: Owner (all), others (branch only)
- **Query**: `?branch_id=UUID&user_id=UUID&record_type=customer|loan|payment&start_date=date&end_date=date&limit=50`
- **Response**: `ActivityLog[]`

#### GET /api/activity-logs?record_type=:recordType&record_id=:recordId
- **Description**: Get logs for specific record
- **Access**: Owner, branch users
- **Response**: `ActivityLog[]`

---

### Error Responses

#### 400 Bad Request
- Missing required fields
- Invalid data format
- Business rule violation (e.g., branch already has manager)

#### 401 Unauthorized
- No token provided
- Invalid token
- Token expired

#### 403 Forbidden
- User lacks permission
- Trying to access other branch data

#### 404 Not Found
- Resource doesn't exist

#### 409 Conflict
- Unique constraint violation (e.g., duplicate email)
- Business rule conflict (e.g., only one manager per branch)

#### 500 Internal Server Error
- Database errors
- Unexpected errors

---

### Data Isolation Rules (Enforced Server-Side)

1. **Owner**: Access all branches and data
2. **BranchManager**: Access only own branch data
3. **Admin**: Access only own branch data
4. **Cashier**: Access only own branch data
5. **Staff**: 
   - Access only assigned customers
   - Can record payments for assigned customers
   - Cannot create customers or loans
6. **ViewOnly**: Can view reports and activity logs only

---

### Activity Logging

Every action must be logged:
- Customer Created/Updated/Deleted
- Loan Created/Updated/Approved/Rejected
- Loan Forwarded (by manager)
- Payment Added
- Deposit Added
- Withdrawal Added
- User Created/Updated/Deleted
- Branch Manager Assigned/Removed

Log must contain:
- user_id, user_name, user_role
- branch_id
- action (specific action taken)
- record_type (customer, loan, payment, etc)
- record_id (the ID of the record affected)
- timestamp
