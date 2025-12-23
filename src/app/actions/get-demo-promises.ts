'use server'

import { createClient } from '@supabase/supabase-js'

export async function getDemoPromises(userId?: string, role?: string) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is missing')
        return { promises: [], error: 'Configuration error' }
    }

    // Use service role key to bypass RLS for demo
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // Fetch promises for demo company only
    let query = supabase
        .from('promises')
        .select(`
            *,
            customers!inner (
                id,
                name,
                assigned_user_id,
                companies!inner (
                    slug
                )
            ),
            debts (
                due_date,
                debt_type
            )
        `)
        .eq('customers.companies.slug', 'demo')
        .order('promised_date')

    // Apply Role-Based Filtering
    if (userId && role) {
        if (role === 'seller') {
            // Seller sees only their own customers' promises
            query = query.eq('customers.assigned_user_id', userId)
        } else if (role === 'manager') {
            // Manager sees their own AND their team's customers' promises
            const { data: teamMembers } = await supabase
                .from('profiles')
                .select('id')
                .eq('manager_id', userId)
            
            const teamIds = teamMembers?.map(m => m.id) || []
            const allowedUserIds = [userId, ...teamIds]
            
            query = query.in('customers.assigned_user_id', allowedUserIds)
        }
        // Accounting/Admin see all (no extra filter)
    }

    const { data: promises, error } = await query

    if (error) {
        console.error('getDemoPromises error:', error)
        return { promises: [], error }
    }

    return { promises, error: null }
}
