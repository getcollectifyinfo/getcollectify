import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage({ params }: { params: Promise<{ domain: string }> }) {
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

    // Calculate totals for placeholders (optional improvement)
    const totalReceivable = debts?.reduce((acc, debt) => acc + debt.remaining_amount, 0) || 0

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
                <h1 className="text-lg font-bold md:text-2xl">Dashboard - {domain}</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Toplam Açık Alacak
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalReceivable)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% geçen aydan (Demo)
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gecikmiş</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺12,000.00</div>
                        <p className="text-xs text-muted-foreground">Demo Verisi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Takip Oranı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">%45</div>
                        <p className="text-xs text-muted-foreground">Demo Verisi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aranmayanlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                        <p className="text-xs text-muted-foreground">14+ gündür not yok</p>
                    </CardContent>
                </Card>
            </div>

            <DashboardClient debts={debtsWithFormatting} />
        </div>
    )
}
