# GVC System Implementation - Testing & Verification Guide

## Overview
This document provides comprehensive testing steps for all 9 requirements implemented in the GVC system update.

---

## Testing Checklist

### 1. LOAN SYNC ISSUE - Real-Time Data Updates ✓

**Objective**: Verify that Customer Management → View Loan always shows the latest data from Loan Portfolio

#### Test Cases

**TC1.1: Loan Details Update Reflects Immediately**
- [ ] In Loan Portfolio, update a loan (change amount/interest)
- [ ] Go to Customer Management → View Loan
- [ ] Verify new values display immediately (not stale)
- [ ] Expected: Fresh data appears without page refresh

**TC1.2: Collection History Syncs**
- [ ] In Loan Portfolio, add a collection record
- [ ] Open Customer Management → View Loan
- [ ] Go to Collection History tab
- [ ] Verify new collection appears
- [ ] Expected: Latest collection history visible

**TC1.3: Due Schedule Updates**
- [ ] In Loan Portfolio, update schedule (add/remove installments)
- [ ] Open Customer Management → View Loan
- [ ] Check Due Schedule tab
- [ ] Verify latest schedule matches
- [ ] Expected: Dynamic schedule reflects changes

**TC1.4: No Stale Data on Focus**
- [ ] Open Customer Management → View Loan modal
- [ ] Switch to another tab in browser
- [ ] Return to GVC app window
- [ ] Verify data is fresh (not cached from before switch)
- [ ] Expected: Data refreshes on window focus

#### Success Criteria
✓ All queries bypass client-side caching  
✓ Data always fetches fresh from server  
✓ No older than 1 second old when displayed  

---

### 2. DUE STATUS CALCULATION BUG - Payment-Based Status ✓

**Objective**: Verify that due status accurately reflects actual payment records

#### Test Cases

**TC2.1: PAID Status - 100% Payment**
- [ ] Create loan with 10 installments of $1000 each
- [ ] Pay $1000 for installment #1
- [ ] Check due schedule
- [ ] Expected: Installment #1 shows Status = PAID

**TC2.2: PARTIAL Status - Partial Payment**
- [ ] Create loan installment of $1000
- [ ] Pay $500
- [ ] Check due schedule
- [ ] Expected: Status = PARTIAL

**TC2.3: OVERDUE Status - Past Due + Unpaid**
- [ ] Create installment with due_date = yesterday
- [ ] No payments made
- [ ] Check due schedule
- [ ] Expected: Status = OVERDUE

**TC2.4: PENDING Status - Future + Unpaid**
- [ ] Create installment with due_date = 30 days from now
- [ ] No payments made
- [ ] Check due schedule
- [ ] Expected: Status = PENDING

**TC2.5: OVERDUE Status - Past Due + Partial Payment**
- [ ] Create installment of $1000, due = yesterday
- [ ] Pay $600
- [ ] Check due schedule
- [ ] Expected: Status = OVERDUE (not PARTIAL)

**TC2.6: Status Matches Payment History**
- [ ] Create multiple installments
- [ ] Make various payments
- [ ] Check that every row's status matches:
  - [ ] Payment History total
  - [ ] Collection History
  - [ ] Actual ledger
- [ ] Expected: No discrepancies

#### Success Criteria
✓ PAID: 100% of installment paid  
✓ PARTIAL: 0-99% of installment paid  
✓ OVERDUE: Past due date AND not fully paid  
✓ PENDING: Future date AND not paid  
✓ All statuses match actual payment records  

---

### 3. FLEXIBLE DUE SCHEDULE - Dynamic Extension ✓

**Objective**: Verify that schedule extends beyond original term for underpayments

#### Test Cases

**TC3.1: Original Schedule Created**
- [ ] Create loan: Principal=$10,000, Term=24 months
- [ ] Check due schedule
- [ ] Expected: 24 installments generated

**TC3.2: Schedule Extends for Underpayment**
- [ ] Create loan with 24 installments
- [ ] Pay only 80% of installment #5 & #8
- [ ] Check due schedule
- [ ] Expected: Schedule now has >24 installments
- [ ] Expected: Remaining balance shown in extra installments

**TC3.3: Remaining Balance Recoverable**
- [ ] Create loan with underpayments
- [ ] Sum all remaining_balance from extended schedule
- [ ] Expected: Total outstanding matches loan ledger

**TC3.4: Schedule Stabilizes**
- [ ] After adding extensions, make no more payments
- [ ] Check schedule in 1 hour
- [ ] Expected: Same schedule (no new extensions if no new payments)

**TC3.5: Dynamic Schedule Report**
- [ ] View loan with extended schedule
- [ ] Check schedule report
- [ ] Expected: Shows originalTermMonths vs extendedMonths

#### Success Criteria
✓ Schedule extends beyond original term  
✓ Remaining balance always recoverable  
✓ Outstanding amount never disappears  
✓ Schedule is stable (deterministic)  

---

### 4. FD STATUS BUG - Blocked FD Status ✓

**Objective**: Verify that blocked FDs show BLOCKED status across all views

#### Test Cases

**TC4.1: Block FD Changes Status**
- [ ] Create FD in ACTIVE status
- [ ] Click Block FD button
- [ ] Enter reason "Customer requested suspension"
- [ ] Check FD listing
- [ ] Expected: Status = BLOCKED (not ACTIVE)

**TC4.2: Blocked Status in All Views**
- [ ] Block an FD
- [ ] Check in FD listing
- [ ] Expected: BLOCKED status visible
- [ ] Check in FD details
- [ ] Expected: BLOCKED status visible
- [ ] Check in Customer FD records
- [ ] Expected: BLOCKED status visible

**TC4.3: Unblock Returns to ACTIVE**
- [ ] Block an FD (status = BLOCKED)
- [ ] Click Unblock button
- [ ] Check status
- [ ] Expected: Status = ACTIVE

**TC4.4: Block Reason Recorded**
- [ ] Block FD with reason "Compliance issue"
- [ ] Check FD details
- [ ] Expected: block_reason field shows "Compliance issue"

**TC4.5: Blocked Timestamp Recorded**
- [ ] Block FD
- [ ] Check blocked_at field
- [ ] Expected: Current timestamp recorded
- [ ] Expected: blocked_by shows user ID

**TC4.6: FD Operations on Blocked**
- [ ] Block an FD
- [ ] Try to make transactions (maturity/withdrawal)
- [ ] Expected: Not allowed or shows warning

#### Success Criteria
✓ Block → Status = BLOCKED  
✓ Unblock → Status = ACTIVE  
✓ Status reflects actual state across all views  
✓ No cached or stale status values  
✓ Block reason and timestamps recorded  

---

### 5. OWNER DELETE WITH PASSWORD - Security ✓

**Objective**: Verify password-protected customer deletion

#### Test Cases

**TC5.1: Password Verification Required**
- [ ] Click Delete Customer button
- [ ] Modal appears asking for password
- [ ] Try empty password
- [ ] Expected: Error message

**TC5.2: Incorrect Password Rejected**
- [ ] Click Delete Customer
- [ ] Enter wrong password
- [ ] Click Continue
- [ ] Expected: Error "Invalid password"

**TC5.3: Correct Password Accepted**
- [ ] Click Delete Customer
- [ ] Enter correct owner password
- [ ] Click Continue
- [ ] Expected: Proceeds to preview

**TC5.4: Password Not Logged**
- [ ] Check audit trail
- [ ] Expected: Password field NOT in logs (security)
- [ ] Expected: Only "deletion requested" logged

#### Success Criteria
✓ Password verification required  
✓ Only owner can delete  
✓ Password not logged in audit  
✓ Deletion reason captured  

---

### 6. CUSTOMER ARCHIVE PDF - Document Generation ✓

**Objective**: Verify PDF generation before deletion

#### Test Cases

**TC6.1: PDF Generated Successfully**
- [ ] Start customer deletion
- [ ] Verify password
- [ ] Check if PDF generation starts
- [ ] Expected: PDF successfully created

**TC6.2: PDF Contains All Sections**
- [ ] Download generated PDF
- [ ] Open and verify sections:
  - [ ] Company header with logo
  - [ ] Customer information
  - [ ] NIC, address, contact
  - [ ] All loans with details
  - [ ] Payment history
  - [ ] Collection history
  - [ ] Due schedule
  - [ ] FD records
  - [ ] Documents/images
  - [ ] Audit trail
- [ ] Expected: All sections present

**TC6.3: Images Embedded in PDF**
- [ ] Download PDF
- [ ] Check for NIC images, customer photos, etc.
- [ ] Expected: All images embedded (not links)

**TC6.4: PDF Professional Formatting**
- [ ] Open PDF in viewer
- [ ] Check formatting:
  - [ ] Company letterhead visible
  - [ ] Proper spacing/margins
  - [ ] Readable fonts
  - [ ] Tables formatted correctly
  - [ ] Page numbers visible
  - [ ] Generated date/time present
- [ ] Expected: Professional appearance

**TC6.5: PDF Downloads Automatically**
- [ ] Complete deletion flow
- [ ] Expected: PDF download starts before deletion
- [ ] Expected: Saved with filename like "customer-archive-{id}.pdf"

#### Success Criteria
✓ PDF generates before deletion  
✓ All sections included  
✓ Images embedded  
✓ Professional formatting  
✓ Auto-downloads  

---

### 7. PERMANENT DELETION - Cascading Delete ✓

**Objective**: Verify all related data is deleted with transaction support

#### Test Cases

**TC7.1: Customer Profile Deleted**
- [ ] Delete a customer
- [ ] Try to view customer
- [ ] Expected: "Customer not found"

**TC7.2: All Loans Deleted**
- [ ] Delete customer with 5 loans
- [ ] Check loan listing
- [ ] Expected: No loans for that customer

**TC7.3: All Payments Deleted**
- [ ] Delete customer with payment records
- [ ] Check payment history
- [ ] Expected: No payments for that customer

**TC7.4: All Collections Deleted**
- [ ] Delete customer
- [ ] Check collections listing
- [ ] Expected: No collections for that customer

**TC7.5: All Due Schedules Deleted**
- [ ] Delete customer with schedules
- [ ] Query database directly
- [ ] Expected: No schedule records exist

**TC7.6: All FDs Deleted**
- [ ] Delete customer with fixed deposits
- [ ] Check FD listing
- [ ] Expected: No FDs for that customer

**TC7.7: No Orphan Records**
- [ ] Delete customer
- [ ] Check foreign keys:
  - [ ] No payment records with missing loan_id
  - [ ] No loans with missing customer_id
  - [ ] No schedules with missing loan_id
- [ ] Expected: No orphan records

**TC7.8: Transaction Rollback**
- [ ] Simulate DB error during deletion
- [ ] Expected: Transaction rolls back
- [ ] Expected: Customer data still exists
- [ ] Expected: No partial deletion

#### Success Criteria
✓ Customer deleted completely  
✓ All related data removed  
✓ No orphan records  
✓ No broken foreign keys  
✓ Transaction atomicity maintained  

---

### 8. SECURITY REQUIREMENTS ✓

**Objective**: Verify security measures for deletion operations

#### Test Cases

**TC8.1: Only Owner Can Delete**
- [ ] Login as staff user
- [ ] Try to delete customer
- [ ] Expected: "Not authorized" error
- [ ] Login as owner
- [ ] Can delete
- [ ] Expected: Delete succeeds

**TC8.2: Password Validation**
- [ ] Attempt deletion with wrong password
- [ ] Expected: Blocked
- [ ] Attempt with correct password
- [ ] Expected: Allowed

**TC8.3: Audit Log Created**
- [ ] Delete a customer
- [ ] Check audit_logs table
- [ ] Expected: Entry exists with:
  - [ ] action = "customer_deletion"
  - [ ] owner_name
  - [ ] customer_name
  - [ ] customer_id
  - [ ] deletion_reason
  - [ ] timestamp

**TC8.4: IP/Session Tracking**
- [ ] Delete customer from IP A
- [ ] Check audit trail
- [ ] Expected: IP address recorded
- [ ] Expected: Session ID recorded

**TC8.5: User Session Integrity**
- [ ] Login as owner
- [ ] Delete customer
- [ ] Check logs show correct owner
- [ ] Expected: Deletion attributed to correct user

#### Success Criteria
✓ Only owner can delete  
✓ Password required  
✓ Audit trail complete  
✓ IP/session tracked  
✓ No privilege escalation possible  

---

### 9. BUILD & REGRESSION TESTING ✓

**Objective**: Verify no TypeScript/build errors and no regressions

#### Test Cases

**TC9.1: TypeScript Build Passes**
```bash
npm run build
# Expected: No errors, no warnings
```
- [ ] Run build command
- [ ] Expected: Exit code 0
- [ ] Expected: No type errors

**TC9.2: All Imports Resolve**
- [ ] Check all new services import correctly
- [ ] Expected: No "module not found" errors
- [ ] Expected: All types resolve

**TC9.3: No Regressions - Customers**
- [ ] List customers
- [ ] Expected: Works as before
- [ ] Create customer
- [ ] Expected: Works as before
- [ ] Edit customer
- [ ] Expected: Works as before

**TC9.4: No Regressions - Loans**
- [ ] List loans
- [ ] Expected: Works as before
- [ ] Create loan
- [ ] Expected: Works as before
- [ ] View loan details
- [ ] Expected: Works as before

**TC9.5: No Regressions - Payments**
- [ ] Collect payment
- [ ] Expected: Works as before
- [ ] View payment history
- [ ] Expected: Works as before

**TC9.6: No Regressions - FDs**
- [ ] List FDs
- [ ] Expected: Works as before
- [ ] Create FD
- [ ] Expected: Works as before
- [ ] View FD details
- [ ] Expected: Works as before

**TC9.7: No Console Errors**
- [ ] Open browser console (F12)
- [ ] Perform all operations
- [ ] Expected: No red error messages
- [ ] Expected: Only info/warning logs

**TC9.8: Performance Not Degraded**
- [ ] List 100+ customers
- [ ] Expected: Loads in <3 seconds
- [ ] View large loan portfolio
- [ ] Expected: No lag or slowness

#### Success Criteria
✓ TypeScript builds without errors  
✓ All imports resolve  
✓ No regressions  
✓ No console errors  
✓ Performance maintained  

---

## Test Execution Plan

### Phase 1: Unit Testing (30 mins)
- [ ] Test all utility functions (dueStatusCalculator, scheduleCalculator)
- [ ] Test service functions in isolation
- [ ] Verify calculations match expected values

### Phase 2: Integration Testing (1 hour)
- [ ] Test components with services
- [ ] Test data flow between layers
- [ ] Verify API calls work

### Phase 3: UI Testing (1.5 hours)
- [ ] Test all user interactions
- [ ] Test modals and forms
- [ ] Verify error handling

### Phase 4: End-to-End Testing (1 hour)
- [ ] Test complete workflows
- [ ] Test cross-feature interactions
- [ ] Verify real-world scenarios

### Phase 5: Regression Testing (30 mins)
- [ ] Test all existing features
- [ ] Verify no breakage
- [ ] Build verification

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] TypeScript build successful
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security review complete
- [ ] Backup created
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Rollback plan ready

---

## Monitoring

After deployment, monitor:

- [ ] Error rates in logs
- [ ] API response times
- [ ] PDF generation success rate
- [ ] Deletion operation completion
- [ ] Database transaction rollbacks
- [ ] Audit log entries
- [ ] User feedback

---

**Document Version**: 1.0  
**Last Updated**: 2024-06-15  
**Status**: Ready for Testing  
