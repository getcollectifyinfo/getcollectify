
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DebtsTab from './debts-tab'
import PaymentsTab from './payments-tab'

export default async function CustomerDetailPage({
    params,
}: {
    params: Promise<{ domain: string; id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch Customer
    const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

    if (!customer) {
        notFound()
    }

    // 2. Fetch Debts (for calculating totals mainly, or list)
    const { data: debts } = await supabase
        .from('debts')
        .select('*')
        .eq('customer_id', id)
        .order('due_date')

    // 3. Fetch Payments
    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', id)
        .order('payment_date', { ascending: false })

    const totalDebt = debts?.reduce((acc, curr) => acc + (curr.remaining_amount || 0), 0) || 0

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Link href="/customers" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{customer.name}</h1>
                    <p className="text-muted-foreground">{customer.phone || 'Telefon yok'}</p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">Toplam Borç</div>
                        <div className="text-2xl font-bold">₺{totalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="debts" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="debts">Borçlar</TabsTrigger>
                    <TabsTrigger value="notes">Notlar</TabsTrigger>
                    <TabsTrigger value="promises">Sözler</TabsTrigger>
                    <TabsTrigger value="payments">Tahsilatlar</TabsTrigger>
                </TabsList>

                <TabsContent value="debts">
                    <DebtsTab customerId={id} debts={debts || []} />
                </TabsContent>

                <TabsContent value="notes">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Notlar</CardTitle>
                            <Button size="sm" variant="outline">Not Ekle</Button>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Notlar burada listelenecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="promises">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Ödeme Sözleri</CardTitle>
                            <Button size="sm" variant="outline">Söz Ekle</Button>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Ödeme sözleri burada listelenecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <PaymentsTab customerId={id} payments={payments || []} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
