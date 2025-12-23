import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export default async function DashboardPage({ params }: { params: Promise<{ domain: string }> }) {
    const { domain } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let baseCurrency = 'TRY'
    let totalOpenBase = 0

    if (user) {
        if (domain.startsWith('demo')) {
            const admin = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )
            const { data: profile } = await admin
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single()
            if (profile) {
                const { data: company } = await admin
                    .from('companies')
                    .select('id, base_currency')
                    .eq('id', profile.company_id)
                    .single()
                baseCurrency = company?.base_currency || baseCurrency

                const { data: debts } = await admin
                    .from('debts')
                    .select('currency, remaining_amount, status')
                    .eq('status', 'open')

                const { data: rates } = await admin
                    .from('fx_rates')
                    .select('base_currency, quote_currency, rate, date')
                    .eq('company_id', profile.company_id)
                    .eq('base_currency', baseCurrency)
                    .order('date', { ascending: false })

                const latestByQuote = new Map<string, number>()
                rates?.forEach(r => {
                    if (!latestByQuote.has(r.quote_currency)) {
                        latestByQuote.set(r.quote_currency, r.rate)
                    }
                })

                debts?.forEach(d => {
                    if (d.currency === baseCurrency) {
                        totalOpenBase += d.remaining_amount || 0
                    } else {
                        const rate = latestByQuote.get(d.currency)
                        if (rate && rate > 0) {
                            totalOpenBase += (d.remaining_amount || 0) / rate
                        }
                    }
                })
            }
        } else {
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id, role')
                .eq('id', user.id)
                .single()
            if (profile) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('id, base_currency')
                    .eq('id', profile.company_id)
                    .single()
                baseCurrency = company?.base_currency || baseCurrency

                let debtsQuery = supabase
                    .from('debts')
                    .select('currency, remaining_amount, status, customers!inner (assigned_user_id)')
                    .eq('status', 'open')

                if (profile.role === 'seller') {
                    debtsQuery = debtsQuery.eq('customers.assigned_user_id', user.id)
                } else if (profile.role === 'manager') {
                    const { data: team } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('manager_id', user.id)
                    const teamIds = team?.map(t => t.id) || []
                    const allowed = [user.id, ...teamIds]
                    debtsQuery = debtsQuery.in('customers.assigned_user_id', allowed)
                }

                const { data: debts } = await debtsQuery

                const { data: rates } = await supabase
                    .from('fx_rates')
                    .select('base_currency, quote_currency, rate, date')
                    .eq('company_id', profile.company_id)
                    .eq('base_currency', baseCurrency)
                    .order('date', { ascending: false })

                const latestByQuote = new Map<string, number>()
                rates?.forEach(r => {
                    if (!latestByQuote.has(r.quote_currency)) {
                        latestByQuote.set(r.quote_currency, r.rate)
                    }
                })

                debts?.forEach(d => {
                    if (d.currency === baseCurrency) {
                        totalOpenBase += d.remaining_amount || 0
                    } else {
                        const rate = latestByQuote.get(d.currency)
                        if (rate && rate > 0) {
                            totalOpenBase += (d.remaining_amount || 0) / rate
                        }
                    }
                })
            }
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-bold md:text-2xl">Dashboard - {domain}</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="text-sm font-medium">Toplam Açık Alacak ({baseCurrency})</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: baseCurrency }).format(totalOpenBase)}
                        </div>
                        <p className="text-xs text-muted-foreground">Baz döviz kuruna dönüştürülmüş toplam</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="text-sm font-medium">Gecikmiş</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Yakında</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="text-sm font-medium">Takip Oranı</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Yakında</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="text-sm font-medium">Aranmayanlar</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Yakında</p>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Dashboard İçeriği</h2>
                <p className="text-muted-foreground">
                    Alacaklar, baz döviz kuruna çevrilerek gösterilir. Diğer metrikler yakında eklenecek.
                </p>
            </div>
        </div>
    )
}
