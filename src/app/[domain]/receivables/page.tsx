import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ReceivablesClient } from './receivables-client'
import { getUsers } from '@/app/actions/get-users'

export default async function ReceivablesPage({ params }: { params: Promise<{ domain: string }> }) {
    const { domain } = await params
    console.log('ReceivablesPage rendering for domain:', domain)

    // Fetch company settings for debt types and currencies
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get current user role first
    let currentUserRole = ''
    if (user) {
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        currentUserRole = currentProfile?.role || ''
    }

    let companyId = ''
    let debtTypes = ['Cari', 'Çek', 'Senet']
    let currencies = ['TRY', 'USD', 'EUR']

    // For demo subdomain, get demo company ID
    if (domain.startsWith('demo')) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing')
        } else {
            const { createClient: createServiceClient } = await import('@supabase/supabase-js')
            const serviceSupabase = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            )

            const { data: demoCompany, error: demoCompanyError } = await serviceSupabase
                .from('companies')
                .select('*')
                .eq('slug', 'demo')
                .single()

            if (demoCompanyError) {
                console.error('ReceivablesPage: Error fetching demo company:', demoCompanyError)
            }

            if (demoCompany) {
                companyId = demoCompany.id
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                debtTypes = (demoCompany as any).debt_types || debtTypes
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                currencies = (demoCompany as any).currencies || currencies
                console.log('ReceivablesPage: Demo company found:', { companyId, debtTypes })
            } else {
                console.warn('ReceivablesPage: Demo company NOT found')
            }
        }
    } else if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (profile) {
            companyId = profile.company_id
            const { data: company } = await supabase
                .from('companies')
                .select('*')
                .eq('id', profile.company_id)
                .single()

            if (company) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                debtTypes = (company as any).debt_types || debtTypes
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                currencies = (company as any).currencies || currencies
            }
        }
    }

    // For demo subdomain, use service role to bypass RLS issues
    let debts = null
    if (domain.startsWith('demo')) {
        console.log('Fetching demo debts...', { userId: user?.id, role: currentUserRole })
        const { getDemoDebts } = await import('@/app/actions/get-demo-debts')
        const result = await getDemoDebts(user?.id, currentUserRole)
        if (result.error) console.error('Error fetching demo debts:', result.error)
        debts = result.debts
        console.log('Fetched demo debts count:', debts?.length)
    } else {
        // For non-demo, use regular RLS-protected query
        // But enforce role-based filtering explicitly to match business rules
        
        let query = supabase
            .from('debts')
            .select(`
                *,
                customers!inner (
                    name,
                    assigned_user_id,
                    profiles:assigned_user_id (
                        name
                    ),
                    notes (count),
                    promises (count)
                )
            `)
            .eq('status', 'open')
            .order('due_date', { ascending: true })

        if (user && currentUserRole === 'seller') {
            query = query.eq('customers.assigned_user_id', user.id)
        } else if (user && currentUserRole === 'manager') {
            const { data: teamMembers } = await supabase
                .from('profiles')
                .select('id')
                .eq('manager_id', user.id)
            
            const teamIds = teamMembers?.map(m => m.id) || []
            const allowedUserIds = [user.id, ...teamIds]
            
            query = query.in('customers.assigned_user_id', allowedUserIds)
        }

        const { data } = await query.limit(50)
        debts = data
    }

    // Prepare debts data for client component
    const debtsWithFormatting = debts?.map((debt) => {
        let dueDateFormatted = '-'
        let isOverdue = false
        let delayText = '-'

        if (debt.due_date) {
            try {
                const dueDate = parseISO(debt.due_date)
                isOverdue = isPast(dueDate)
                delayText = isOverdue
                    ? formatDistanceToNow(dueDate, { locale: tr, addSuffix: false }) + ' gecikme'
                    : formatDistanceToNow(dueDate, { locale: tr, addSuffix: false }) + ' kaldı'
                dueDateFormatted = dueDate.toLocaleDateString('tr-TR')
            } catch (e) {
                console.error('Date parsing error for debt:', debt.id, e)
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customer = debt.customers as any
        const notesCount = customer?.notes?.[0]?.count || 0
        const promisesCount = customer?.promises?.[0]?.count || 0
        const hasActivity = notesCount > 0 || promisesCount > 0

        return {
            ...debt,
            dueDateFormatted,
            isOverdue,
            delayText,
            hasActivity,
        }
    }) || []

    // Fetch sellers and managers
    const { users: allUsers } = await getUsers()
    const sellers = allUsers?.filter(u => ((u.role === 'seller' || u.role === 'manager') && u.active)) || []

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold md:text-2xl">Alacaklar</h1>
            </div>

            <ReceivablesClient
                debts={debtsWithFormatting}
                companyId={companyId}
                debtTypes={debtTypes}
                currencies={currencies}
                users={sellers}
                currentUserRole={currentUserRole}
            />
        </div>
    )
}
