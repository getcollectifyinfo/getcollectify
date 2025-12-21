'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface UpdateCompanySettingsInput {
    debtTypes?: string[]
    currencies?: string[]
}

export async function updateCompanySettings(companyId: string, input: UpdateCompanySettingsInput) {
    try {
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

        const updateData: any = {}
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
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in updateCompanySettings:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
