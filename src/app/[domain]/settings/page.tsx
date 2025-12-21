import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GeneralSettingsTab from './general-tab'
import FxRatesTab from './fx-rates-tab'
import UsersTab from './users-tab'
import ConfigTab from './config-tab'

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

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return <div>Profil bulunamadı</div>

    const { data: company } = await supabase.from('companies').select('*').eq('id', profile.company_id).single()

    // 2. Fetch Users
    const { data: users } = await supabase.from('profiles').select('*').eq('company_id', profile.company_id)

    // 3. Fetch FX Rates
    const { data: fxRates } = await supabase.from('fx_rates').select('*').eq('company_id', profile.company_id).order('date', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Ayarlar</h1>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">Genel</TabsTrigger>
                    <TabsTrigger value="config">Yapılandırma</TabsTrigger>
                    <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
                    <TabsTrigger value="fx">Döviz Kurları</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <GeneralSettingsTab company={company} />
                </TabsContent>

                <TabsContent value="config">
                    <ConfigTab company={company} />
                </TabsContent>

                <TabsContent value="users">
                    <UsersTab users={users || []} />
                </TabsContent>

                <TabsContent value="fx">
                    <FxRatesTab fxRates={fxRates || []} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
