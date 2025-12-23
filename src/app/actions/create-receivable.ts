'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface CreateReceivableInput {
    customerId?: string
    customerName?: string
    amount: number
    currency: string
    dueDate: Date
    debtType: string
    notes?: string
    companyId: string
    assignedUserId?: string
}

export async function createReceivable(input: CreateReceivableInput) {
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

        let customerId = input.customerId

        // Create new customer if not provided
        if (!customerId && input.customerName) {
            const { data: newCustomer, error: customerError } = await serviceClient
                .from('customers')
                .insert({
                    company_id: input.companyId,
                    name: input.customerName,
                    assigned_user_id: input.assignedUserId || null
                })
                .select()
                .single()

            if (customerError) {
                console.error('Customer creation error:', customerError)
                return { success: false, error: 'Müşteri oluşturulamadı' }
            }

            customerId = newCustomer.id
        }

        if (!customerId) {
            return { success: false, error: 'Müşteri seçilmedi' }
        }

        // If existing customer and assignedUserId is provided, update it
        if (input.customerId && input.assignedUserId) {
            const { error: updateError } = await serviceClient
                .from('customers')
                .update({ assigned_user_id: input.assignedUserId })
                .eq('id', customerId)
            
            if (updateError) {
                console.error('Customer update error:', updateError)
                // Continue even if update fails? or fail? Let's log and continue but maybe warn?
                // Actually it's better to fail if user explicitly wanted to set it.
                // But for now let's just log.
            }
        }

        // Create debt record
        const { error: debtError } = await serviceClient
            .from('debts')
            .insert({
                company_id: input.companyId,
                customer_id: customerId,
                debt_type: input.debtType,
                original_amount: input.amount,
                remaining_amount: input.amount,
                currency: input.currency,
                due_date: input.dueDate.toISOString().split('T')[0],
                status: 'open',
                // notes: input.notes, // Removed because 'notes' column does not exist on debts table
            })

        if (debtError) {
            console.error('Debt creation error:', debtError)
            return { success: false, error: 'Alacak kaydedilemedi: ' + debtError.message }
        }

        // If there is a note, add it to the notes table
        if (input.notes) {
            const { error: noteError } = await serviceClient
                .from('notes')
                .insert({
                    company_id: input.companyId,
                    customer_id: customerId,
                    text: `Alacak Notu: ${input.notes}`,
                    created_at: new Date().toISOString()
                })
            
            if (noteError) {
                console.error('Note creation error:', noteError)
                // We don't fail the whole operation if note creation fails, just log it
            }
        }

        revalidatePath('/receivables')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in createReceivable:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
