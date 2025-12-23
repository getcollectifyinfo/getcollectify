'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function getCustomerTimeline(customerId: string) {
    try {
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

        // Fetch notes with creator profile
        const { data: notes, error: notesError } = await supabase
            .from('notes')
            .select(`
        id,
        created_at,
        contact_person,
        phone,
        text,
        promised_date,
        created_by_user_id,
        debt_id,
        profiles:created_by_user_id (
          name
        ),
        debts:debt_id (
          debt_type,
          due_date,
          remaining_amount,
          currency
        )
      `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (notesError) {
            console.error('Notes fetch error:', notesError)
        }

        // Fetch promises with creator profile
        const { data: promises, error: promisesError } = await supabase
            .from('promises')
            .select(`
        id,
        created_at,
        promised_date,
        amount,
        currency,
        status,
        created_by_user_id,
        debt_id,
        profiles:created_by_user_id (
          name
        )
      `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (promisesError) {
            console.error('Promises fetch error:', promisesError)
        }

        return {
            notes: notes || [],
            promises: promises || [],
        }
    } catch (error) {
        console.error('Unexpected error in getCustomerTimeline:', error)
        return {
            notes: [],
            promises: [],
        }
    }
}
