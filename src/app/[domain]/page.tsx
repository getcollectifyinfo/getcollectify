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
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

export default async function DashboardPage({ params }: { params: Promise<{ domain: string }> }) {
    const { domain } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    console.log('Dashboard User:', user?.email)

    // Fetch debts with customer details
    const { data: debts, error } = await supabase
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

    console.log('DEBUG_DEBTS:', { count: debts?.length, error, user: (await supabase.auth.getUser()).data.user?.email })

    console.log('Debts Fetch:', debts?.length, error)

    // Calculate totals for placeholders (optional improvement)
    const totalReceivable = debts?.reduce((acc, debt) => acc + debt.remaining_amount, 0) || 0

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

            <div className="grid gap-4 md:grid-cols-1">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Alacak Listesi & İşlem Takvimi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Müşteri</TableHead>
                                    <TableHead>Borç Tipi</TableHead>
                                    <TableHead>Vade Tarihi</TableHead>
                                    <TableHead>Gecikme</TableHead>
                                    <TableHead className="text-right">Tutar</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {debts?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Açık borç bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    debts?.map((debt) => {
                                        const dueDate = parseISO(debt.due_date)
                                        const isOverdue = isPast(dueDate)
                                        const delayText = isOverdue
                                            ? formatDistanceToNow(dueDate, { locale: tr, addSuffix: false }) + ' gecikme'
                                            : formatDistanceToNow(dueDate, { locale: tr, addSuffix: false }) + ' kaldı'

                                        return (
                                            <TableRow key={debt.id}>
                                                <TableCell className="font-medium">
                                                    <Link href={`/customers/${debt.customer_id}`} className="hover:underline text-blue-600">
                                                        {debt.customers?.name || 'Bilinmeyen Müşteri'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{debt.debt_type}</Badge>
                                                </TableCell>
                                                <TableCell>{dueDate.toLocaleDateString('tr-TR')}</TableCell>
                                                <TableCell>
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {delayText}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: debt.currency }).format(debt.remaining_amount)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="secondary" asChild>
                                                        <Link href={`/customers/${debt.customer_id}?tab=notes`}>
                                                            Not Ekle
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
