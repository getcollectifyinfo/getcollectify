'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface UpdateCompanySettingsInput {
    debtTypes?: string[]
    currencies?: string[]
}

export async function updateCompanySettings(companyId: string, input: UpdateCompanySettingsInput) {
    try {
        const userClient = await createClient()
        const { data: { user } } = await userClient.auth.getUser()
        if (!user) {
            return { success: false, error: 'Oturum açmanız gerekiyor' }
        }

        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Role kontrolü ve şirket doğrulaması
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, company_id')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'company_admin') {
            return { success: false, error: 'Kayıt için Şirket Admini Rolünü seçmelisiniz' }
        }

        if (profile.company_id !== companyId) {
            return { success: false, error: 'Şirket doğrulaması başarısız' }
        }

        const updateData: { debt_types?: string[]; currencies?: string[] } = {}
        if (input.debtTypes) {
            updateData.debt_types = input.debtTypes
        }
        if (input.currencies) {
            updateData.currencies = input.currencies
        }

        const { error } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', companyId)

        if (error) {
            console.error('Settings update error:', error)
            return { success: false, error: 'Ayarlar güncellenemedi' }
        }

        revalidatePath('/settings')
        revalidatePath('/receivables')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in updateCompanySettings:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
