'use server'

import { createClient } from '@supabase/supabase-js'

export async function getDemoDebts(userId?: string, role?: string) {
    console.log('getDemoDebts started', { userId, role })
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is missing')
        return { debts: null, error: 'Configuration error' }
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

    let query = supabase
        .from('debts')
        .select(`
      *,
      customers!inner (
        name,
        company_id,
        assigned_user_id,
        profiles:assigned_user_id (
            name
        ),
        notes (count),
        promises (count)
      ),
      companies!inner (
        slug
      )
    `)
        .eq('companies.slug', 'demo')
        .eq('status', 'open')
        .order('due_date', { ascending: true })

    // Apply Role-Based Filtering
    if (userId && role) {
        if (role === 'seller') {
            // Seller sees only their own customers' debts
            query = query.eq('customers.assigned_user_id', userId)
        } else if (role === 'manager') {
            // Manager sees their own AND their team's customers' debts
            // 1. Get team members
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

    const { data: debts, error } = await query.limit(50) // Increased limit since we might filter

    if (error) {
        console.error('getDemoDebts error:', error)
        return { debts: null, error }
    }

    console.log('getDemoDebts success, count:', debts?.length)
    return { debts, error: null }
}
