'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function searchCustomers(query: string, companyId: string) {
    console.log('searchCustomers started:', { query, companyId })
    try {
        if (!companyId) {
            console.warn('searchCustomers: companyId is empty')
            return { customers: [] }
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing')
            return { customers: [] }
        }

        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Search customers by name
        const { data: customers, error } = await supabase
            .from('customers')
            .select(`
        id,
        name,
        assigned_user_id,
        debts (
          remaining_amount,
          currency
        )
      `)
            .eq('company_id', companyId)
            .ilike('name', `%${query}%`)
            .limit(10)

        if (error) {
            console.error('Customer search error:', error)
            return { customers: [] }
        }

        // Calculate total debt for each customer
        const customersWithTotals = customers?.map(customer => {
            const totalDebt = customer.debts?.reduce((sum: number, debt: { remaining_amount: number }) => {
                return sum + (debt.remaining_amount || 0)
            }, 0) || 0

            return {
                id: customer.id,
                name: customer.name,
                totalDebt,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                currency: (customer.debts as any[])?.[0]?.currency || 'TRY'
            }
        }) || []

        return { customers: customersWithTotals }
    } catch (error) {
        console.error('Unexpected error in searchCustomers:', error)
        return { customers: [] }
    }
}
