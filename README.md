# GVC Agro Finance Management System

A full-stack, responsive, and modern Loan & Savings Management Web Application built for small and medium finance businesses in Sri Lanka.

## Architecture

This is a **Complete Full-Stack Application** divided into two parts:

### 1. Backend (`/backend`)
- **Node.js + Express** + **TypeScript**
- **Supabase PostgreSQL** Database (Schema is in `/database/schema.sql`)
- Custom ID Generation for Customers (`CUS-`), Loans (`LON-`), Payments (`PAY-`), etc.
- Full API for Auth, Users, Customers, Loans, Savings, Reports, and Reminders.
- Flat-rate interest calculations, late fee penalties, and due date logic.
- JWT Role-based Authentication (Owner, Admin, Staff, View-Only).

### 2. Frontend (`/frontend`)
- **React + Vite** + **TypeScript**
- **Tailwind CSS** with premium glassmorphism styling (`.glass-card`).
- State Management: **Zustand** (Auth) & **React Query** (Server state).
- Dashboard with charts, live updates, and summary cards.
- Mobile and desktop responsive design.

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- A Supabase Project (PostgreSQL)

### Setup Database
1. Go to your Supabase project's SQL Editor.
2. Copy and paste the contents of `d:\gvc\database\schema.sql` and run it.
3. (Optional) Run `d:\gvc\database\seed.sql` to populate sample data.

### Run the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   PORT=5000
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-secret
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Run the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` (it defaults to pointing at localhost:5000).
4. Start the app:
   ```bash
   npm run dev
   ```

## Deployment
- **Frontend**: Configured for Vercel (`vercel.json` included).
- **Backend**: Configured for Render (`render.yaml` included).

## Key Features Built
- ✅ **Authentication**: Secure Login, session management.
- ✅ **Dashboard**: Live stats, recent transactions, quick actions.
- ✅ **Customers**: Search, filter, view history, add/edit.
- ✅ **Loans**: Principal/duration setup, auto-schedule generation, real-time balances.
- ✅ **Savings**: Deposits, withdrawals, interest rates.
- ✅ **Due Reminders**: Track today's due and overdue loans, late fee calculation.
- ✅ **Reports**: 7 predefined aggregated reports for financial auditing.
- ✅ **Settings & Users**: RBAC and company settings configuration.
