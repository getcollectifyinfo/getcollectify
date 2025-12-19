# System Architecture

## Overview
Collectify is a multi-tenant SaaS application built with Next.js (App Router), Supabase (Auth, Postgres, Realtime), and deployed on Vercel.

## Tenant Isolation Strategy
We use **Subdomain-based Multi-tenancy**.
- **URL Structure**: `https://{slug}.getcollectify.com`
- **Tenant Resolution**: 
  - `src/middleware.ts` intercepts every request.
  - It parses the `Host` header.
  - If the host is a subdomain, it rewrites the request to `/src/app/[domain]/...`.
  - The `[domain]` dynamic route segment allows pages to access the tenant slug via `params.domain`.

## Data Isolation (RLS)
We enforce strict data isolation using PostgreSQL Row Level Security (RLS).
- All tenant-specific tables (`customers`, `debts`, etc.) have a `company_id` column.
- RLS Policies enforce that a user can only `SELECT/INSERT/UPDATE` rows where `company_id` matches their assigned company.
- **Authentication**: Users are authenticated via Supabase Auth.
- **Authorization**: The `profiles` table links an Auth User ID to a `company_id` and a `role`.
- **Helper Function**: `get_my_company_id()` function in Postgres securely retrieves the current user's company ID from the `profiles` table.

## Role-Based Access Control (RBAC)
Roles are defined in the `profiles` table:
- `company_admin`: Full access.
- `accounting`: Manage payments/debts.
- `manager`: Access own + team's customers.
- `seller`: Access only assigned customers.

RLS policies incorporate these roles. For example, `payments` table restricts `INSERT` to `company_admin` and `accounting` roles.

## Deployment Configuration (Vercel)
1. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ROOT_DOMAIN` (e.g., getcollectify.com)

2. **Domains**:
   - Add `getcollectify.com` to Vercel.
   - Add `*.getcollectify.com` to Vercel to support wildcard subdomains.

## Authentication Logic
- **Signup**: Creates a Company and an Admin User/Profile.
- **Login**: Users must login on their specific subdomain (`slug.getcollectify.com/login`).
- **Global Login**: `/login` on the root domain asks for the workspace slug and redirects.

