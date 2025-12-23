
import { createClient } from '@/lib/supabase/server'
import CustomersClient from './customers-client'

export default async function CustomersPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params

    // Get current user role
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    
    let currentUserRole = ''
    const currentUserId = user?.id

    if (user) {
        // Use service client or user client? User client is fine for profile reading usually.
        // But to be safe and consistent with previous pages:
        const { data: currentProfile } = await supabaseUser
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        currentUserRole = currentProfile?.role || ''
    }

    const canAddCustomer = ['company_admin', 'accounting'].includes(currentUserRole)

    let customers = []

    // For demo subdomain, use service role to bypass RLS
    if (domain.startsWith('demo')) {
        const { createClient: createServiceClient } = await import('@supabase/supabase-js')
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

        // Get demo company customers
        const { data: demoCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('slug', 'demo')
            .single()

        if (demoCompany) {
            let query = supabase
                .from('customers')
                .select(`
                    *,
                    profiles:assigned_user_id (
                        name
                    ),
                    debts (
                        id,
                        remaining_amount,
                        due_date,
                        currency
                    ),
                    notes (
                        created_at
                    ),
                    promises (
                        created_at,
                        promise_date
                    )
                `)
                .eq('company_id', demoCompany.id)
                .eq('archived', false)
                .order('name')

            if (currentUserId && currentUserRole) {
                if (currentUserRole === 'seller') {
                    query = query.eq('assigned_user_id', currentUserId)
                } else if (currentUserRole === 'manager') {
                    const { data: teamMembers } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('manager_id', currentUserId)
                    
                    const teamIds = teamMembers?.map(m => m.id) || []
                    const allowedUserIds = [currentUserId, ...teamIds]
                    
                    query = query.in('assigned_user_id', allowedUserIds)
                }
            }

            const { data } = await query
            customers = data || []
        }
    } else {
        // For non-demo, use regular RLS-protected query
        const supabase = await createClient()
        let query = supabase
            .from('customers')
            .select(`
                *,
                profiles:assigned_user_id (
                    name
                ),
                debts (
                    id,
                    remaining_amount,
                    due_date,
                    currency
                ),
                notes (
                    created_at
                ),
                promises (
                    created_at,
                    promise_date
                )
            `)
            .eq('archived', false)
            .order('name')
        
        if (currentUserRole === 'seller') {
            query = query.eq('assigned_user_id', currentUserId)
        } else if (currentUserRole === 'manager') {
             const { data: teamMembers } = await supabase
                .from('profiles')
                .select('id')
                .eq('manager_id', currentUserId)
            
            const teamIds = teamMembers?.map(m => m.id) || []
            const allowedUserIds = [currentUserId, ...teamIds]
            
            query = query.in('assigned_user_id', allowedUserIds)
        }

        const { data } = await query
        customers = data || []
    }

    return (
        <CustomersClient customers={customers} currentUserRole={currentUserRole} />
    )
}
