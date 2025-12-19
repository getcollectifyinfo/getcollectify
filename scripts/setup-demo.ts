import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const DEMO_USERS = [
    { email: 'demo-admin@collectify.com', password: 'demo1234', role: 'admin' },
    { email: 'demo-manager@collectify.com', password: 'demo1234', role: 'manager' },
    { email: 'demo-seller@collectify.com', password: 'demo1234', role: 'seller' },
    { email: 'demo-accounting@collectify.com', password: 'demo1234', role: 'accounting' },
]

async function main() {
    console.log('🚀 Starting Demo Setup...')

    // 1. Create Users
    for (const user of DEMO_USERS) {
        console.log(`Creating user: ${user.email}...`)

        // Check if user exists
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existing = users.find(u => u.email === user.email)

        let userId = existing?.id

        if (!existing) {
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true
            })
            if (error) {
                console.error(`Failed to create ${user.email}:`, error.message)
            } else {
                userId = data.user.id
                console.log(`✅ User created: ${user.email}`)
            }
        } else {
            console.log(`ℹ️ User already exists: ${user.email}`)
            // Update password just in case
            await supabase.auth.admin.updateUserById(userId!, { password: user.password })
        }
    }

    // 2. Create Company
    console.log('Creating Demo Company...')
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .upsert({
            name: 'Collectify Demo A.Ş.',
            slug: 'demo',
            base_currency: 'TRY'
        }, { onConflict: 'slug' })
        .select()
        .single()

    if (companyError) {
        console.error('Failed to create company:', companyError.message)
        return
    }

    const companyId = company.id
    console.log(`✅ Company ready: ${company.name} (${companyId})`)

    // 3. Link Users to Profiles (This is critical for RLS)
    // We need to insert into 'profiles' table manually since we bypassed the UI signup
    console.log('Linking users to profiles...')

    // Fetch latest user list to get IDs
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers()

    for (const demoUser of DEMO_USERS) {
        const authUser = allUsers.find(u => u.email === demoUser.email)
        if (authUser) {
            // Map generic roles to Schema-defined Enum roles
            // role check (company_admin, accounting, manager, seller)
            let dbRole = demoUser.role
            if (dbRole === 'admin') dbRole = 'company_admin'

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authUser.id,
                    email: demoUser.email,
                    role: dbRole,
                    company_id: companyId,
                    name: demoUser.role.toUpperCase() + ' USER'
                })

            if (profileError) console.error(`Failed to create profile for ${demoUser.email}:`, profileError.message)
            else console.log(`✅ Profile linked: ${demoUser.email}`)
        }
    }

    console.log('🎉 Setup Complete! You can now run the seed.sql script safely to populate data, OR we could do it here.')
    console.log('Do you want to populate data? (Auto-populating basic data now...)')

    // 4. Basic Data Population
    // Cleanup old data
    await supabase.from('debts').delete().eq('company_id', companyId)
    await supabase.from('customers').delete().eq('company_id', companyId)

    // Create Customers
    const customers = [
        { company_id: companyId, name: 'Acme Lojistik', phone: '05551112233' },
        { company_id: companyId, name: 'Yıldız Tekstil', phone: '05554445566' }
    ]

    const { data: createdCustomers, error: custError } = await supabase.from('customers').insert(customers).select()

    if (custError) {
        console.error('Customer insert failed:', custError.message)
    }

    if (createdCustomers && createdCustomers.length > 0) {
        console.log(`✅ Created ${createdCustomers.length} customers`)

        const cust1 = createdCustomers[0]
        const cust2 = createdCustomers[1]

        // Create Debt
        await supabase.from('debts').insert([
            { company_id: companyId, customer_id: cust1.id, debt_type: 'Cari', due_date: new Date().toISOString(), original_amount: 150000, currency: 'TRY', remaining_amount: 150000, status: 'open' },
            { company_id: companyId, customer_id: cust2.id, debt_type: 'Çek', due_date: new Date(Date.now() + 86400000 * 5).toISOString(), original_amount: 50000, currency: 'TRY', remaining_amount: 50000, status: 'open' }
        ])
        console.log('✅ Created sample debts')
    }

}

main().catch(console.error)
