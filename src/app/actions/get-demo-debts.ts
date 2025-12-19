'use server'

import { createClient } from '@supabase/supabase-js'

export async function getDemoDebts() {
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

    // Fetch debts for demo company only
    const { data: debts, error } = await supabase
        .from('debts')
        .select(`
      *,
      customers (
        name,
        company_id
      ),
      companies!inner (
        slug
      )
    `)
        .eq('companies.slug', 'demo')
        .eq('status', 'open')
        .order('due_date', { ascending: true })
        .limit(10)

    if (error) {
        console.error('getDemoDebts error:', error)
        return { debts: null, error }
    }

    return { debts, error: null }
}
