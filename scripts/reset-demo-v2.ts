
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
    process.exit(1)
}

// Create a Supabase client with the Service Role Key (admin access)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const DEMO_USERS = [
    { email: 'demo-admin@collectify.com', password: 'demo1234', role: 'company_admin', name: 'Demo Admin' },
    { email: 'demo-manager@collectify.com', password: 'demo1234', role: 'manager', name: 'Demo Manager' },
    { email: 'demo-seller@collectify.com', password: 'demo1234', role: 'seller', name: 'Demo Seller' },
    { email: 'demo-accounting@collectify.com', password: 'demo1234', role: 'accounting', name: 'Demo Accounting' },
]

async function main() {
    console.log('🚀 Starting Demo Reset (V2)...')

    // 1. Create/Update Demo Company
    console.log('🏢 Setting up Demo Company...')
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
        console.error('❌ Failed to create/update company:', companyError.message)
        process.exit(1)
    }
    console.log(`✅ Company ready: ${company.name} (${company.id})`)

    // 2. Create/Update Auth Users and Profiles
    console.log('👥 Setting up Demo Users & Profiles...')
    
    // Get existing users to check for existence
    const { data: { users: existingUsers }, error: listUsersError } = await supabase.auth.admin.listUsers()
    if (listUsersError) {
        console.error('❌ Failed to list users:', listUsersError.message)
        process.exit(1)
    }

    const userIds: Record<string, string> = {}

    for (const userInfo of DEMO_USERS) {
        let userId = existingUsers.find(u => u.email === userInfo.email)?.id

        if (!userId) {
            // Create new user
            const { data, error } = await supabase.auth.admin.createUser({
                email: userInfo.email,
                password: userInfo.password,
                email_confirm: true,
                user_metadata: { name: userInfo.name }
            })
            if (error) {
                console.error(`❌ Failed to create user ${userInfo.email}:`, error.message)
                continue
            }
            userId = data.user.id
            console.log(`✨ Created user: ${userInfo.email}`)
        } else {
            // Update password just in case
            await supabase.auth.admin.updateUserById(userId, {
                password: userInfo.password,
                user_metadata: { name: userInfo.name }
            })
            console.log(`🔄 Updated user: ${userInfo.email}`)
        }

        userIds[userInfo.role] = userId

        // UPSERT Profile
        // Note: 'role' in profiles table must match the enum in DB
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                company_id: company.id,
                email: userInfo.email,
                name: userInfo.name,
                role: userInfo.role,
                active: true
            })

        if (profileError) {
            console.error(`❌ Failed to update profile for ${userInfo.email}:`, profileError.message)
        } else {
            console.log(`✅ Profile synced for ${userInfo.email}`)
        }
    }

    // 3. Setup Manager Relationships (Assign Seller to Manager)
    if (userIds['seller'] && userIds['manager']) {
        const { error: managerError } = await supabase
            .from('profiles')
            .update({ manager_id: userIds['manager'] })
            .eq('id', userIds['seller'])
        
        if (managerError) console.error('❌ Failed to link seller to manager:', managerError.message)
        else console.log('🔗 Linked Demo Seller to Demo Manager')
    }

    // 4. Reset Demo Data (Customers)
    console.log('🧹 Cleaning old demo data...')
    // We only delete data belonging to this company
    await supabase.from('debts').delete().eq('company_id', company.id)
    await supabase.from('customers').delete().eq('company_id', company.id)

    console.log('📦 Seeding customers...')
    const customersData = [
        { name: 'Acme Lojistik A.Ş.', phone: '05551112233', assigned_user_id: userIds['seller'] },
        { name: 'Yıldız Tekstil Ltd. Şti.', phone: '05324445566', assigned_user_id: userIds['seller'] },
        { name: 'Mega İnşaat Yapı', phone: '02123334455', assigned_user_id: userIds['admin'] }, // Admin's customer
        { name: 'Beta Gıda Sanayi', phone: '02167778899', assigned_user_id: userIds['manager'] }, // Manager's customer
    ]

    for (const cust of customersData) {
        if (!cust.assigned_user_id) continue

        const { error } = await supabase.from('customers').insert({
            company_id: company.id,
            name: cust.name,
            phone: cust.phone,
            assigned_user_id: cust.assigned_user_id
        })
        if (error) console.error(`❌ Failed to add customer ${cust.name}:`, error.message)
    }

    console.log('✅ Demo Environment Reset Complete!')
    console.log('👉 You can now login at: http://demo.localhost:3000/login')
}

main().catch(console.error)
