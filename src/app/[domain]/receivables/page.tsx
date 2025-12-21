import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ReceivablesClient } from './receivables-client'

export default async function ReceivablesPage({ params }: { params: Promise<{ domain: string }> }) {
    const { domain } = await params

    // For demo subdomain, use service role to bypass RLS issues
    let debts = null
    if (domain.startsWith('demo')) {
        const { getDemoDebts } = await import('@/app/actions/get-demo-debts')
        const result = await getDemoDebts()
        debts = result.debts
    } else {
        // For non-demo, use regular RLS-protected query
        const supabase = await createClient()
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
            <div className="flex items-center">
                <h1 className="text-lg font-bold md:text-2xl">Alacaklar</h1>
            </div>

            <ReceivablesClient debts={debtsWithFormatting} />
        </div>
    )
}
