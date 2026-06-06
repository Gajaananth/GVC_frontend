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

## Supabase service_role grants (production step)

If you are deploying to Supabase (hosted Postgres), you must grant the `service_role` the necessary permissions so the backend (which uses the `SUPABASE_SERVICE_ROLE_KEY`) can read and write the affected tables. Without these grants, live requests can fail with Postgres permission errors (SQLSTATE 42501).

Run the following in the Supabase SQL editor (Project → SQL → New query) as a project owner, or execute via `psql` against your database as a superuser:

```sql
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.physical_form_submissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_assignment_changes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_correction_requests TO service_role;
```

Notes:
- The repository includes `migrations/009_service_role_permissions.sql` which contains the same statements; running it in your migration tooling (or applying it manually in Supabase) will achieve the same result.
- Only execute these grants from a trusted operator account (project owner). Do not expose the `service_role` key publicly — it has elevated privileges.
- After applying these grants, redeploy your backend and re-test the endpoints that previously returned 500 errors (examples: `/api/forms/pending`, `/api/collections/corrections/approved`).

If you prefer to run via `psql`, you can use the connection string from Supabase (Settings → Database → Connection string) and run:

```bash
# example (replace with your connection string):
# psql "postgresql://postgres:password@dbhost:5432/postgres?sslmode=require" -c "GRANT USAGE ON SCHEMA public TO service_role;"
```

Contact the database owner or Supabase support if you do not have permission to run these statements.

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
