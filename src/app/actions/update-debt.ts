'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface UpdateDebtInput {
    debtId: string
    debtType: string
    dueDate: Date
    amount: number
    currency: string
}

export async function updateDebt(input: UpdateDebtInput) {
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

        if (!profile || !['company_admin', 'accounting'].includes(profile.role)) {
            return { success: false, error: 'Bu işlem için yetkiniz yok' }
        }

        // Get current debt to calculate paid amount
        const { data: currentDebt, error: fetchError } = await serviceClient
            .from('debts')
            .select('original_amount, remaining_amount')
            .eq('id', input.debtId)
            .single()

        if (fetchError || !currentDebt) {
            return { success: false, error: 'Borç bulunamadı' }
        }

        const paidAmount = currentDebt.original_amount - currentDebt.remaining_amount
        const newRemainingAmount = input.amount - paidAmount

        if (newRemainingAmount < 0) {
            return { success: false, error: 'Yeni tutar, ödenen tutardan küçük olamaz' }
        }

        const { error } = await serviceClient
            .from('debts')
            .update({
                debt_type: input.debtType,
                due_date: input.dueDate.toISOString().split('T')[0],
                original_amount: input.amount,
                remaining_amount: newRemainingAmount,
                currency: input.currency
            })
            .eq('id', input.debtId)

        if (error) {
            console.error('Error updating debt:', error)
            return { success: false, error: 'Borç güncellenirken hata oluştu' }
        }

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in updateDebt:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
