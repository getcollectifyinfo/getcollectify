
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('Checking profiles...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  } else {
    console.log(`Found ${profiles.length} profiles:`)
    console.log(profiles)
  }

  console.log('\nChecking companies...')
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')

  if (companiesError) {
    console.error('Error fetching companies:', companiesError)
  } else {
    console.log(`Found ${companies.length} companies:`)
    console.log(companies)
  }

  console.log('\nChecking auth users...')
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.error('Error fetching users:', usersError)
  } else {
    console.log(`Found ${users.length} auth users:`)
    users.forEach(u => console.log(`${u.id} - ${u.email}`))
  }
}

main()
