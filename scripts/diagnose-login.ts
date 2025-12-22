
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('❌ Missing env vars')
    process.exit(1)
}

async function diagnose() {
    console.log('🕵️‍♀️ Starting Diagnosis...')

    // 1. Try to login as demo-seller using CLIENT (Anon) Key
    // This simulates the browser/app behavior
    const client = createClient(supabaseUrl, anonKey!)
    
    console.log('\n--- 1. Login Attempt (Client) ---')
    const { data: { user }, error: loginError } = await client.auth.signInWithPassword({
        email: 'demo-seller@collectify.com',
        password: 'demo1234'
    })

    if (loginError || !user) {
        console.error('❌ Login failed:', loginError?.message)
        return
    }
    console.log(`✅ Logged in as: ${user.email} (${user.id})`)

    // 2. Try to fetch OWN profile using CLIENT connection
    // This tests RLS
    console.log('\n--- 2. Fetch Profile (Client / RLS Check) ---')
    const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('❌ Failed to fetch profile (Client):', profileError.message)
        console.error('Details:', profileError)
    } else if (!profile) {
        console.error('❌ Profile is NULL (Client). RLS might be hiding it.')
    } else {
        console.log('✅ Profile found (Client):', profile)
    }

    // 3. Verify data exists using ADMIN connection
    // This tests if data actually exists in DB
    console.log('\n--- 3. Verify Data Existence (Admin) ---')
    const admin = createClient(supabaseUrl, serviceRoleKey!)
    
    const { data: adminProfile, error: adminError } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (adminError) {
        console.error('❌ Failed to fetch profile (Admin):', adminError.message)
    } else if (!adminProfile) {
        console.error('❌ Profile DOES NOT EXIST in database (Admin confirm).')
    } else {
        console.log('✅ Profile exists in DB (Admin):', adminProfile)
    }

    // 4. Check Policies
    // We can't easily query pg_policies via JS client unless we use rpc or specific setup, 
    // but the comparison between Step 2 and Step 3 tells us if it's RLS.
    
    if (adminProfile && !profile) {
        console.log('\n🚨 DIAGNOSIS: RLS BLOCKING ACCESS')
        console.log('The profile exists, but the user cannot see it.')
        console.log('Fix: Check "profiles" table RLS policies.')
    } else if (!adminProfile) {
        console.log('\n🚨 DIAGNOSIS: DATA MISSING')
        console.log('The profile record was not created.')
    } else {
        console.log('\n✅ DIAGNOSIS: EVERYTHING LOOKS FINE via Script.')
        console.log('If app still fails, check "supabase.auth.getUser()" in the server action context.')
    }
}

diagnose()
