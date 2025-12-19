'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

    revalidatePath('/')
    return { success: true }
}
