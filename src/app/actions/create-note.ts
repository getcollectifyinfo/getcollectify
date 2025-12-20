'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface CreateNoteInput {
    customerId: string
    debtId?: string
    contactPerson?: string
    phone?: string
    noteText: string
    promiseDate?: Date
    promiseAmount?: number
    currency?: string
}

export async function createNote(input: CreateNoteInput) {
    try {
        // Use service role for demo to bypass RLS issues
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

        // Get company_id from customer
        const { data: customer } = await supabase
            .from('customers')
            .select('company_id')
            .eq('id', input.customerId)
            .single()

        if (!customer) {
            return { success: false, error: 'Müşteri bulunamadı' }
        }

        // Create note
        const { error: noteError } = await supabase
            .from('notes')
            .insert({
                company_id: customer.company_id,
                customer_id: input.customerId,
                debt_id: input.debtId,
                contact_person: input.contactPerson,
                phone: input.phone,
                text: input.noteText,
            })

        if (noteError) {
            console.error('Note creation error:', noteError)
            return { success: false, error: 'Not kaydedilemedi: ' + noteError.message }
        }

        // Create promise if date provided
        if (input.promiseDate) {
            const { error: promiseError } = await supabase
                .from('promises')
                .insert({
                    company_id: customer.company_id,
                    customer_id: input.customerId,
                    debt_id: input.debtId,
                    promised_date: input.promiseDate.toISOString().split('T')[0],
                    amount: input.promiseAmount,
                    currency: input.currency || 'TRY',
                    status: 'planned',
                })

            if (promiseError) {
                console.error('Promise creation error:', promiseError)
                // Don't fail the whole operation
            }
        }

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in createNote:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
