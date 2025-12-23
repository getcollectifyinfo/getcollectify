'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function deleteDebt(debtId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Oturum açmanız gerekiyor' }
        }

        const serviceClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Check user role
        const { data: profile } = await serviceClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return { success: false, error: 'Kullanıcı profili bulunamadı' }
        }

        // Admin and Accounting can delete anything
        if (['company_admin', 'accounting'].includes(profile.role)) {
            // Allowed
        } 
        // Others (Manager, Seller, etc.) cannot delete debts
        else {
            return { success: false, error: 'Bu işlem için yetkiniz yok' }
        }

        // Delete related notes and promises first (cascade usually handles this but good to be safe if no cascade)
        // Schema checks: 
        // notes -> debt_id references debts(id) (no cascade specified in schema snippet, default is usually restrict or no action unless specified. 
        // Looking at schema.sql: "debt_id uuid references debts(id)" - no "on delete cascade". 
        // So we must delete children first or update schema.
        
        // Let's delete children manually to be safe.
        await serviceClient.from('notes').delete().eq('debt_id', debtId)
        await serviceClient.from('promises').delete().eq('debt_id', debtId)
        await serviceClient.from('payments').delete().eq('debt_id', debtId)

        const { error } = await serviceClient
            .from('debts')
            .delete()
            .eq('id', debtId)

        if (error) {
            console.error('Error deleting debt:', error)
            return { success: false, error: 'Borç silinirken hata oluştu' }
        }

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in deleteDebt:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
