import { createClient } from '@/lib/supabase/server'
import { CalendarView } from './calendar-view'

export default async function CalendarPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    let promises = []

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id
    let role = ''

    if (userId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()
        role = profile?.role || ''
    }

    if (domain.startsWith('demo')) {
        const { getDemoPromises } = await import('@/app/actions/get-demo-promises')
        const result = await getDemoPromises(userId, role)
        if (result.promises) {
            promises = result.promises
        }
    } else {
        // Non-demo: use RLS + explicit filtering for safety
        let query = supabase
            .from('promises')
            .select(`
                *,
                customers!inner (
                    id,
                    name,
                    assigned_user_id
                ),
                debts (
                    due_date,
                    debt_type
                )
            `)
            .order('promised_date')

        if (role === 'seller') {
            query = query.eq('customers.assigned_user_id', userId)
        } else if (role === 'manager') {
            // For manager in non-demo, we need team logic.
            // Since we are using standard client here, we can try to use RLS if it supports it,
            // or fetch team members first.
            const { data: teamMembers } = await supabase
                .from('profiles')
                .select('id')
                .eq('manager_id', userId)
            
            const teamIds = teamMembers?.map(m => m.id) || []
            const allowedUserIds = [userId, ...teamIds]
            
            // Note: If using 'customers!inner', the filter applies on the joined table
            query = query.in('customers.assigned_user_id', allowedUserIds)
        }
        
        const { data } = await query
        
        if (data) {
            promises = data
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Takvim</h1>
            </div>

            <CalendarView promises={promises || []} />
        </div>
    )
}
