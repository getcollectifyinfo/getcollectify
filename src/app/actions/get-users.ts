'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function getUsers() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { users: [], error: 'Unauthorized' }

        // Use Admin Client for database operations to bypass RLS policies
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing Service Role Key')
            return { users: [], error: 'Server configuration error' }
        }

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Get current user's profile to find company_id using Admin client
        // (Use Admin client to ensure we can read the profile even if RLS is strict)
        const { data: currentProfile } = await supabaseAdmin
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (!currentProfile) return { users: [], error: 'Profile not found' }

        const { data: users, error } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                name,
                email,
                role,
                active,
                manager:manager_id (
                    id,
                    name
                )
            `)
            .eq('company_id', currentProfile.company_id)
            .order('name')

        if (error) {
            console.error('Error fetching users:', error)
            return { users: [], error }
        }

        return { users, error: null }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { users: [], error: 'Unexpected error' }
    }
}
