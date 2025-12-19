'use server'

import { createClient } from '@/lib/supabase/server'
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
        const supabase = await createClient()

        // Get current user and company
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Oturum bulunamadı' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return { success: false, error: 'Profil bulunamadı' }
        }

        // Create note
        const { error: noteError } = await supabase
            .from('notes')
            .insert({
                company_id: profile.company_id,
                customer_id: input.customerId,
                debt_id: input.debtId,
                contact_person: input.contactPerson,
                phone: input.phone,
                text: input.noteText,
                created_by_user_id: user.id,
            })

        if (noteError) {
            console.error('Note creation error:', noteError)
            return { success: false, error: 'Not kaydedilemedi' }
        }

        // Create promise if date provided
        if (input.promiseDate) {
            const { error: promiseError } = await supabase
                .from('promises')
                .insert({
                    company_id: profile.company_id,
                    customer_id: input.customerId,
                    debt_id: input.debtId,
                    promised_date: input.promiseDate.toISOString().split('T')[0], // Convert to date string
                    amount: input.promiseAmount,
                    currency: input.currency || 'TRY',
                    status: 'planned',
                    created_by_user_id: user.id,
                })

            if (promiseError) {
                console.error('Promise creation error:', promiseError)
                // Don't fail the whole operation if promise fails
                // Note was already created successfully
            }
        }

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in createNote:', error)
        return { success: false, error: 'Beklenmeyen bir hata oluştu' }
    }
}
