'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSiteUrl } from '@/lib/utils'

// Mapping of roles to Seeded User Emails
const DEMO_USERS = {
    admin: 'demo-admin@collectify.com',
    accounting: 'demo-accounting@collectify.com',
    manager: 'demo-manager@collectify.com',
    seller: 'demo-seller@collectify.com',
}

export async function loginAsDemoUser(role: keyof typeof DEMO_USERS) {
    const email = DEMO_USERS[role]
    if (!email) return { success: false, error: 'Invalid role' }

    const supabase = await createClient()

    // Sign in with password (must be consistent in seed)
    // We assume password is 'demo1234' for all demo users
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'demo1234'
    })

    if (error) {
        return { success: false, error: error.message }
    }

    // Verify profile exists
    // Use Admin Client to bypass RLS recursion issues
    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { success: false, error: 'Login failed unexpectedly' }
    }

    const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        await supabase.auth.signOut()
        return { success: false, error: 'Kullanıcı profili bulunamadı. Lütfen yönetici ile iletişime geçin.' }
    }

    revalidatePath('/', 'layout')
    
    // Force absolute URL redirect to ensure middleware handles it correctly
    // and to clear potential client-side router cache issues.
    // This dynamically handles localhost vs production using environment variables.
    const targetUrl = getSiteUrl('demo', '/')
    
    redirect(targetUrl)
}
