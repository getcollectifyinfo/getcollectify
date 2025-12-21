import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ReceivablesClient } from './receivables-client'

export default async function ReceivablesPage({ params }: { params: Promise<{ domain: string }> }) {
    const { domain } = await params

    // Fetch company settings for debt types and currencies
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let companyId = ''
    let debtTypes = ['Cari', 'Çek', 'Senet']
    let currencies = ['TRY', 'USD', 'EUR']

    // For demo subdomain, get demo company ID
    if (domain.startsWith('demo')) {
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

        const { data: demoCompany } = await serviceSupabase
            .from('companies')
            .select('id, debt_types, currencies')
            .eq('slug', 'demo')
            .single()

        if (demoCompany) {
            companyId = demoCompany.id
            debtTypes = demoCompany.debt_types || debtTypes
            currencies = demoCompany.currencies || currencies
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
                .select('debt_types, currencies')
                .eq('id', profile.company_id)
                .single()

            if (company) {
                debtTypes = company.debt_types || debtTypes
                currencies = company.currencies || currencies
            }
        }
    }

    // For demo subdomain, use service role to bypass RLS issues
    let debts = null
    if (domain.startsWith('demo')) {
        const { getDemoDebts } = await import('@/app/actions/get-demo-debts')
        const result = await getDemoDebts()
        debts = result.debts
    } else {
        // For non-demo, use regular RLS-protected query
        const { data } = await supabase
            .from('debts')
            .select(`
                *,
                customers (
                    name
                )
            `)
            .eq('status', 'open')
            .order('due_date', { ascending: true })
            .limit(10)
        debts = data
    }

    // Prepare debts data for client component
    const debtsWithFormatting = debts?.map((debt) => {
        const dueDate = parseISO(debt.due_date)
        const isOverdue = isPast(dueDate)
        const delayText = isOverdue
            ? formatDistanceToNow(dueDate, { locale: tr, addSuffix: false }) + ' gecikme'
            : formatDistanceToNow(dueDate, { locale: tr, addSuffix: false }) + ' kaldı'

        return {
            ...debt,
            dueDateFormatted: dueDate.toLocaleDateString('tr-TR'),
            isOverdue,
            delayText,
        }
    }) || []

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
            />
        </div>
    )
}
