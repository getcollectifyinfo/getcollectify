'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface CreateNoteInput {
    customerId: string
    debtId?: string
    contactPerson?: string
    phone?: string
    noteText?: string
    promiseDate?: Date
    promiseAmount?: number
    currency?: string
}

export async function createNote(input: CreateNoteInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Oturum açmanız gerekiyor' }
        }

        // Use service client for database operations to bypass RLS if needed,
        // but we should validate permissions first.
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

        // Get user profile to check role
        const { data: profile } = await serviceClient
            .from('profiles')
            .select('role, id, manager_id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return { success: false, error: 'Kullanıcı profili bulunamadı' }
        }

        // Get customer to check ownership
        const { data: customer } = await serviceClient
            .from('customers')
            .select('company_id, assigned_user_id')
            .eq('id', input.customerId)
            .single()

        if (!customer) {
            return { success: false, error: 'Müşteri bulunamadı' }
        }

        // Permission Check
        if (['company_admin', 'accounting'].includes(profile.role)) {
            // Admin and Accounting can add notes to any customer
        } else if (profile.role === 'manager') {
            // Manager can add notes to own or team's customers
            if (customer.assigned_user_id !== user.id) {
                // Check if assigned user is in manager's team
                const { data: teamMember } = await serviceClient
                    .from('profiles')
                    .select('id')
                    .eq('id', customer.assigned_user_id)
                    .eq('manager_id', user.id)
                    .single()
                
                if (!teamMember) {
                     return { success: false, error: 'Sadece kendinize veya ekibinize ait müşterilere not ekleyebilirsiniz.' }
                }
            }
        } else if (profile.role === 'seller') {
            // Seller can only add notes to own customers
            if (customer.assigned_user_id !== user.id) {
                return { success: false, error: 'Sadece kendinize ait müşterilere not ekleyebilirsiniz.' }
            }
        } else {
             return { success: false, error: 'Yetkisiz işlem' }
        }

        const createdByUserId = user.id

        // Create note if text or contact info is provided
        if (input.noteText || input.contactPerson || input.phone) {
            const { error: noteError } = await serviceClient
                .from('notes')
                .insert({
                    company_id: customer.company_id,
                    customer_id: input.customerId,
                    debt_id: input.debtId,
                    contact_person: input.contactPerson,
                    phone: input.phone,
                    text: input.noteText || null,
                    created_by_user_id: createdByUserId,
                })

            if (noteError) {
                console.error('Note creation error:', noteError)
                return { success: false, error: 'Not kaydedilemedi: ' + noteError.message }
            }
        }

        // Create promise if date provided
        if (input.promiseDate) {
            const { error: promiseError } = await serviceClient
                .from('promises')
                .insert({
                    company_id: customer.company_id,
                    customer_id: input.customerId,
                    debt_id: input.debtId,
                    promised_date: input.promiseDate.toISOString().split('T')[0],
                    amount: input.promiseAmount,
                    currency: input.currency || 'TRY',
                    status: 'planned',
                    created_by_user_id: createdByUserId,
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
