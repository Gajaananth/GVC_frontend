# GVC System Update - Implementation Plan

**Status**: 🔄 In Progress  
**Date**: 2026-06-15  
**Priority**: CRITICAL

---

## Requirements Overview

| # | Requirement | Priority | Status | Type |
|---|-------------|----------|--------|------|
| 1 | Loan Sync Issue Fix | CRITICAL | ⏳ TODO | Bug Fix |
| 2 | Due Status Calculation Bug | CRITICAL | ⏳ TODO | Bug Fix |
| 3 | Flexible Due Schedule | HIGH | ⏳ TODO | Enhancement |
| 4 | FD Status Bug | HIGH | ⏳ TODO | Bug Fix |
| 5 | Owner Delete with Password | HIGH | ⏳ TODO | New Feature |
| 6 | Customer Archive PDF | HIGH | ⏳ TODO | New Feature |
| 7 | Permanent Customer Deletion | HIGH | ⏳ TODO | Enhancement |
| 8 | Security Requirements | CRITICAL | ⏳ TODO | Security |
| 9 | Testing Requirements | CRITICAL | ⏳ TODO | QA |

---

## Architecture Changes

### 1. Data Sync Layer
**Files to Create/Modify**:
- `src/services/loanSyncService.ts` (NEW)
- `src/hooks/useLoanSync.ts` (NEW)
- `src/services/loanService.ts` (MODIFY - add real-time refresh)

**Key Changes**:
- Real-time query updates
- No client-side caching for loan data
- Direct DB fetch on component mount

### 2. Due Status Calculation
**Files to Create/Modify**:
- `src/utils/dueStatusCalculator.ts` (NEW)
- `src/services/loanService.ts` (MODIFY - update status logic)

**Rules**:
- PAID: 100% of installment paid
- PARTIAL: 0-99% paid
- OVERDUE: Past due date + not fully paid
- PENDING: Future date + not paid

### 3. Dynamic Schedule Extension
**Files to Create/Modify**:
- `src/utils/scheduleCalculator.ts` (NEW)
- `src/services/loanService.ts` (MODIFY - extend schedule logic)

**Logic**:
- Auto-generate future installments
- Track remaining balance
- Extend beyond original term_count

### 4. FD Status Management
**Files to Create/Modify**:
- `src/services/fdService.ts` (NEW)
- `src/pages/FixedDeposits.tsx` (MODIFY - real-time status)

**Changes**:
- Block → Status = BLOCKED
- Unblock → Status = ACTIVE
- Real-time UI updates

### 5. Customer Deletion with Archive
**Files to Create/Modify**:
- `src/components/customers/DeleteCustomerModal.tsx` (NEW)
- `src/services/pdfService.ts` (NEW - for PDF generation)
- `src/services/customerService.ts` (MODIFY - add deletion logic)
- `src/utils/archiveGenerator.ts` (NEW - generate archive PDF)

**Components**:
- Password confirmation modal
- PDF generation & download
- Transaction-based deletion

### 6. Database Transactions
**Files to Create/Modify**:
- `src/services/transactionService.ts` (NEW)

**Features**:
- Transaction wrapper
- Rollback support
- Error handling

---

## Implementation Order

### Phase 1: Data Sync (CRITICAL)
1. Create `loanSyncService.ts`
2. Create `useLoanSync.ts` hook
3. Update Customer Management View Loan component
4. **Test**: Verify sync works

### Phase 2: Due Status Fix (CRITICAL)
1. Create `dueStatusCalculator.ts`
2. Update loan service status logic
3. Fix due schedule display
4. **Test**: Verify status matches payments

### Phase 3: Flexible Schedule (HIGH)
1. Create `scheduleCalculator.ts`
2. Update schedule generation logic
3. Support dynamic extension
4. **Test**: Verify extended schedules

### Phase 4: FD Status Fix (HIGH)
1. Create `fdService.ts`
2. Update FD block/unblock logic
3. Real-time status updates
4. **Test**: Verify block/unblock works

### Phase 5: Customer Deletion (HIGH)
1. Create `pdfService.ts`
2. Create `archiveGenerator.ts`
3. Create `DeleteCustomerModal.tsx`
4. Update `customerService.ts`
5. Add transaction support
6. **Test**: Verify PDF generation and deletion

### Phase 6: Security & Audit (CRITICAL)
1. Implement password validation
2. Add audit logging
3. IP/session tracking
4. **Test**: Verify logs recorded

### Phase 7: Testing & QA
1. Run all test cases
2. Verify no regressions
3. Build verification
4. TypeScript checks

---

## File Structure

### New Files (To Create)
```
src/
├── services/
│   ├── loanSyncService.ts
│   ├── fdService.ts
│   ├── pdfService.ts
│   ├── transactionService.ts
│   └── archiveService.ts
├── hooks/
│   └── useLoanSync.ts
├── utils/
│   ├── dueStatusCalculator.ts
│   ├── scheduleCalculator.ts
│   └── archiveGenerator.ts
└── components/
    └── customers/
        └── DeleteCustomerModal.tsx
```

### Modified Files
```
src/
├── services/
│   ├── loanService.ts
│   └── customerService.ts
└── pages/
    ├── Customers.tsx
    ├── Loans.tsx
    └── FixedDeposits.tsx
```

---

## Key Implementation Details

### 1. Loan Sync Service
```typescript
// Real-time fetch without caching
- getLoanWithPayments(loanId)
- getCollectionHistory(loanId)
- getDueSchedule(loanId)
- Always fetch fresh from DB
- No stale cache
```

### 2. Due Status Calculator
```typescript
// Calculate from payment records
- calculateStatus(installment, payments, dueDate)
- Rules: PAID, PARTIAL, OVERDUE, PENDING
- Match actual payment history
```

### 3. Schedule Calculator
```typescript
// Dynamic schedule generation
- generateSchedule(loan, payments)
- Auto-extend beyond original count
- Calculate remaining balance
- Support underpayments
```

### 4. FD Service
```typescript
// Fixed deposit management
- blockFD(fdId, reason)
- unblockFD(fdId)
- Status = BLOCKED when blocked
- Status = ACTIVE when unblocked
```

### 5. Archive Generator
```typescript
// PDF generation
- generateCustomerArchive(customerId)
- Include all sections
- Embed images
- Professional formatting
- Download automatically
```

### 6. Transaction Service
```typescript
// Database transactions
- begin()
- commit()
- rollback()
- Error handling
```

---

## Testing Checklist

### Data Sync Tests
- [ ] Loan Portfolio update → Customer View shows new data
- [ ] Collection History refreshes
- [ ] Due Schedule reflects changes
- [ ] No stale data visible

### Due Status Tests
- [ ] PAID: 100% paid installments
- [ ] PARTIAL: 1-99% paid
- [ ] OVERDUE: Past due + not paid
- [ ] PENDING: Future date + not paid

### Schedule Tests
- [ ] Original schedule generated correctly
- [ ] Extends beyond original count
- [ ] Tracks remaining balance
- [ ] Underpayments handled

### FD Tests
- [ ] Block → Status = BLOCKED
- [ ] Unblock → Status = ACTIVE
- [ ] UI updates immediately
- [ ] All views show correct status

### Deletion Tests
- [ ] Password validation works
- [ ] PDF generates successfully
- [ ] PDF contains all sections
- [ ] Images embedded in PDF
- [ ] Customer deleted completely
- [ ] All related data removed
- [ ] No orphan records
- [ ] Audit logged

---

## Backward Compatibility

**Changes That Preserve Compatibility**:
✓ Service layer additions (no breaking changes)
✓ New utility functions (no impact on existing code)
✓ Enhanced features (backward compatible)
✓ New optional parameters (defaults preserve behavior)

**Required Migrations**:
- None (additive only)

---

## Build & Deployment

### Pre-Deployment
- [ ] TypeScript compilation: `npm run build`
- [ ] No type errors
- [ ] No build warnings
- [ ] All imports resolve

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing complete

### Deployment
- [ ] Frontend rebuild
- [ ] Backend deployment
- [ ] Database ready
- [ ] Monitoring enabled

---

## Documentation

### Code Documentation
- JSDoc comments on all functions
- Type definitions complete
- Parameter descriptions
- Return value descriptions
- Usage examples

### User Documentation
- Feature descriptions
- Step-by-step guides
- Screenshots (if applicable)
- FAQ

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Data sync delay | Low | Medium | Real-time queries |
| Status calculation incorrect | Low | High | Comprehensive testing |
| PDF generation failure | Medium | Medium | Error handling |
| Deletion issues | Low | Critical | Transaction rollback |
| TypeScript errors | Low | High | Pre-build checks |

---

## Success Criteria

✅ All 9 requirements implemented  
✅ No TypeScript errors  
✅ No build errors  
✅ All tests passing  
✅ Backward compatible  
✅ Production ready  
✅ Security validated  
✅ Performance optimized  

---

## Timeline

- **Phase 1-2**: 2-3 hours
- **Phase 3-4**: 1-2 hours
- **Phase 5-6**: 2-3 hours
- **Phase 7**: 1-2 hours
- **Total**: ~8-10 hours

---

**Implementation Start**: 2026-06-15 00:39 UTC  
**Expected Completion**: 2026-06-15 12:00 UTC  
**Status**: ⏳ Ready to Begin
