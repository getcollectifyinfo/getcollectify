import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import GeneralSettingsTab from './general-tab'
import ConfigTab from './config-tab'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const supabase = await createClient()

    // 1. Fetch Company Info
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Oturum açın</div>

    let profile: { id: string; role: string; company_id: string } | null = null
    let company: { id: string; name: string; base_currency: string; timezone: string; logo_url?: string | null } | null = null

    if (domain.startsWith('demo')) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return <div>Sunucu yapılandırma hatası (Service Role)</div>
        }
        const adminSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: { autoRefreshToken: false, persistSession: false }
            }
        )
        const { data: demoProfile } = await adminSupabase
            .from('profiles')
            .select('id, role, company_id')
            .eq('id', user.id)
            .single()
        profile = demoProfile || null
        if (profile) {
            const { data: demoCompanyById } = await adminSupabase
                .from('companies')
                .select('*')
                .eq('id', profile.company_id)
                .single()
            company = demoCompanyById || null
        } else {
            const { data: demoCompanyBySlug } = await adminSupabase
                .from('companies')
                .select('*')
                .eq('slug', 'demo')
                .single()
            company = demoCompanyBySlug || null
        }
    } else {
        const { data: userProfile } = await supabase.from('profiles').select('id, role, company_id').eq('id', user.id).single()
        profile = userProfile || null
        if (!profile) return <div>Profil bulunamadı</div>
        const { data: userCompany } = await supabase.from('companies').select('*').eq('id', profile.company_id).single()
        company = userCompany || null
    }

    if (!company) return <div>Firma bulunamadı</div>

    const isAdmin = domain.startsWith('demo')
        ? (profile?.role === 'company_admin' || (user.email?.includes('admin') ?? false))
        : profile?.role === 'company_admin'

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Şirket Ayarları</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Şirket Bilgileri</CardTitle>
                    <CardDescription>Firmanızın genel bilgilerini düzenleyin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GeneralSettingsTab company={company} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Para Birimi Seçenekleri ve Alacak Tipleri</CardTitle>
                    <CardDescription>Alacak girişinde kullanılacak seçenekleri yönetin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ConfigTab company={company} />
                </CardContent>
            </Card>

            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Rol ve Yetki Tanımlamaları</CardTitle>
                        <CardDescription>Sistem rolleri ve yetki kapsamları.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Görme Yetkisi</TableHead>
                                    <TableHead>İşlem Yetkisi</TableHead>
                                    <TableHead>Takvim</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Satış Temsilcisi (Seller)</TableCell>
                                    <TableCell>Kendi müşterileri ve borçları</TableCell>
                                    <TableCell>Not/Söz ekleyebilir, müşteri listesinde düzenleme; silme yok</TableCell>
                                    <TableCell>Kendi müşterilerinin ödeme sözleri</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Satış Yöneticisi (Manager)</TableCell>
                                    <TableCell>Kendi ve ekibinin müşterileri ve borçları</TableCell>
                                    <TableCell>Not/Söz ekleyebilir; kendi/ekibinin müşteri ve borçlarını düzenleyip silebilir</TableCell>
                                    <TableCell>Kendi ve ekibinin ödeme sözleri</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Muhasebe (Accounting)</TableCell>
                                    <TableCell>Tüm müşteriler ve borçlar</TableCell>
                                    <TableCell>Manuel/Bulk alacak ekleme, düzenleme, silme; müşteri ekleme/düzenleme/silme</TableCell>
                                    <TableCell>Tüm takvim</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Yönetici (Admin)</TableCell>
                                    <TableCell>Tüm sistem</TableCell>
                                    <TableCell>Tüm işlemler + kullanıcı/rol/şirket ayarları</TableCell>
                                    <TableCell>Tüm takvim</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Ayarları</CardTitle>
                        <CardDescription>Bildirim tercihleriniz. Aksiyonlar daha sonra eklenecek.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">E-posta Bildirimleri</p>
                                <p className="text-sm text-muted-foreground">Ödeme sözü ve gecikme bildirimleri.</p>
                            </div>
                            <Checkbox disabled />
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">SMS Bildirimleri</p>
                                <p className="text-sm text-muted-foreground">Kısa hatırlatmalar ve uyarılar.</p>
                            </div>
                            <Checkbox disabled />
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Günlük Özet</p>
                                <p className="text-sm text-muted-foreground">Günlük alacak ve etkinlik özeti.</p>
                            </div>
                            <Checkbox disabled />
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Geciken Borç Hatırlatma</p>
                                <p className="text-sm text-muted-foreground">Vadesi geçen borçlar için otomatik hatırlatma.</p>
                            </div>
                            <Checkbox disabled />
                        </div>
                        <div className="flex justify-end">
                            <Button disabled>Kaydet</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
