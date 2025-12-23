'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function deleteCustomer(customerId: string) {
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

        if (['company_admin', 'accounting'].includes(profile.role)) {
            // Allow
        } else if (profile.role === 'manager') {
            // Check ownership
            const { data: customer } = await serviceClient
                .from('customers')
                .select('assigned_user_id')
                .eq('id', customerId)
                .single()
            
            if (!customer) {
                return { success: false, error: 'Müşteri bulunamadı' }
            }

            if (customer.assigned_user_id !== user.id) {
                // Check if team member
                const { data: teamMember } = await serviceClient
                    .from('profiles')
                    .select('id')
                    .eq('id', customer.assigned_user_id)
                    .eq('manager_id', user.id)
                    .single()
                
                if (!teamMember) {
                    return { success: false, error: 'Sadece kendinize veya ekibinize ait müşterileri silebilirsiniz.' }
                }
            }
        } else {
            return { success: false, error: 'Bu işlem için yetkiniz yok' }
        }

        // Delete related records manually (in case cascade is not applied yet)
        await serviceClient.from('notes').delete().eq('customer_id', customerId)
        await serviceClient.from('promises').delete().eq('customer_id', customerId)
        await serviceClient.from('payments').delete().eq('customer_id', customerId)
        await serviceClient.from('debts').delete().eq('customer_id', customerId)

        const { error } = await serviceClient
            .from('customers')
            .delete()
            .eq('id', customerId)

        if (error) {
            console.error('Error deleting customer:', error)
            return { success: false, error: 'Müşteri silinirken hata oluştu' }
        }

        revalidatePath('/customers')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in deleteCustomer:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
