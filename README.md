# Collectify

Production-ready multi-tenant SaaS for receivables & collections.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Shadcn UI
- **Deployment**: Vercel

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

3. **Database Setup**
   - Go to your Supabase Dashboard.
   - Open the SQL Editor.
   - Run the contents of `schema.sql` to create tables and RLS policies.
   - (Optional) Run `seed.sql` to populate demo data (requires manual user creation first).

4. **Run Locally**
   ```bash
   npm run dev
   ```
   - Marketing: `http://localhost:3000` or `http://getcollectify.com:3000` (requires hosts file edit)
   - Tenant: `http://demo.localhost:3000` (simulates 'demo' tenant)

## Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Configure **Environment Variables** in Vercel Project Settings.
3. Configure **Domains**:
   - Add your main domain (e.g., `getcollectify.com`).
   - Add the wildcard domain `*.getcollectify.com`.

## Documentation
See `/docs/architecture.md` for details on multi-tenancy and security.
