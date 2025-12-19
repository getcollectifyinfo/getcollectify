# Collectify - Multi-Tenant SaaS Receiver Platform

Collectify is a modern, production-ready SaaS application for managing receivables, debts, and customer relationships. It features a complete multi-tenant architecture where each company gets its own sub-domain and isolated data environment.

## Features

### Core Modules
- **Dashboard**: High-level overview of company financials (Total Debt, active customers).
- **Customers**: Detailed customer management, list view, and adding new customers.
- **Debts (Borçlar)**: Track debts with types (Cari, Çek, Senet) and currencies (TRY, USD, EUR).
- **Payments (Tahsilat)**: Record payments (Cash, Transfer, Credit Card, Check) with automatic FIFO debt allocation.
- **Notes & Promises**: CRM-like features to log customer interactions and track payment promises.
- **Calendar**: Visual monthly calendar showing payment promises and their status (Pending, Kept, Broken).

### Admin & Settings
- **General Settings**: Manage company name, logo, timezone, and base currency.
- **User Management**: List authorized personnel (Role-Based Access Control).
- **FX Rates**: Manage daily exchange rates for multi-currency reporting.
- **Import**: Bulk upload customers and debts via CSV files.

## Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Shadcn/ui
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Deployment**: Vercel

## Getting Started

### 1. Prerequisites
- Node.js 18+
- A Supabase project

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000 # or your domain in production
```

### 3. Database Setup
1. Go to your Supabase Dashboard > SQL Editor.
2. Run the content of `schema.sql`. This will:
   - Create tables (companies, profiles, customers, debts, etc.)
   - Enable RLS policies for security.
   - Create necessary extensions.

### 4. Running Locally
```bash
npm install
npm run dev
```
- **App Access**: `http://localhost:3000` (Main landing/login)
- **Tenant Access**: Use a domain mapping or middleware logic. For local dev, `localhost:3000` acts as the root.

## Deployment

Deploying to Vercel is recommended:

1. **Push to GitHub**: Ensure your code is in a repository.
2. **New Project in Vercel**: Import your repository.
3. **Environment Variables**: Add the variables from step 2 to Vercel Project Settings.
4. **Domains**:
   - Add your custom domain (e.g., `collectify.com`).
   - Add a wildcard domain `*.collectify.com` for multi-tenancy support.

## Project Structure
- `src/app/[domain]`: Tenant-specific routes (Dashboard, Customers, etc.).
- `src/app/actions`: Server Actions for data mutations (Debts, Payments, generic CRUD).
- `src/components`: Reusable UI components (Shadcn).
- `src/middleware.ts`: Handling multi-tenant routing and sub-domains.
