# Database migration — Finance workflows

Run `schema.sql` first, then migrations in order:
1. `migrations/002_finance_workflows.sql`
2. `migrations/003_collections_approval.sql`
3. `migrations/004_loan_products_and_staff.sql`
4. `migrations/005_physical_form_submissions.sql`
5. `migrations/006_branch_and_isolation.sql`
6. `migrations/007_loan_form_url.sql`
7. `migrations/008_loan_application_url.sql`
8. `migrations/009_service_role_permissions.sql`

## Supabase Storage

1. Create a **public** bucket named `gvc-finance-files` (or set `STORAGE_BUCKET` in backend `.env`).
2. Allow authenticated service role uploads (backend uses service role key).

## What this adds

- Customer document uploads (NIC, photo, scanned application form, home/shop images)
- Loan `applied_by` and `in_charge_user_id` staff tracking
- Owner-only loan approval before loans become active
- Admin requests in-charge changes; owner must approve
- Staff: view customers only; admin: create customers and upload documents
- Staff: submit loan due & savings only (date locked to today); admin reconciles cash+online then approves
- Staff mistake letters → owner approves → admin/owner executes correction (date adjustable on correction only)
