'use server'

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
}

export async function createReceivable(input: CreateReceivableInput) {
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

        let customerId = input.customerId

        // Create new customer if not provided
        if (!customerId && input.customerName) {
            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    company_id: input.companyId,
                    name: input.customerName,
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

        // Create debt record
        const { error: debtError } = await supabase
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
                notes: input.notes,
            })

        if (debtError) {
            console.error('Debt creation error:', debtError)
            return { success: false, error: 'Alacak kaydedilemedi: ' + debtError.message }
        }

        revalidatePath('/receivables')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in createReceivable:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
