'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const promiseSchema = z.object({
    customerId: z.string().uuid(),
    amount: z.coerce.number().positive('Tutar pozitif olmalıdır'),
    currency: z.enum(['TRY', 'USD', 'EUR']),
    promiseDate: z.string(), // YYYY-MM-DD
    note: z.string().optional(),
})

export async function createPromise(prevState: unknown, formData: FormData) {
    const validated = promiseSchema.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        currency: formData.get('currency'),
        promiseDate: formData.get('promiseDate'),
        note: formData.get('note'),
    })

    if (!validated.success) {
        return { error: 'Form hatalı: ' + JSON.stringify(validated.error.flatten().fieldErrors), success: false, message: '' }
    }

    const { customerId, amount, currency, promiseDate, note } = validated.data
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum gerekli', success: false, message: '' }

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

    const { data: profile } = await serviceClient.from('profiles').select('company_id, role, manager_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil bulunamadı', success: false, message: '' }

    // Get customer to check ownership
    const { data: customer } = await serviceClient
        .from('customers')
        .select('assigned_user_id')
        .eq('id', customerId)
        .single()

    if (!customer) {
        return { success: false, error: 'Müşteri bulunamadı', message: '' }
    }

    // Permission Check
    if (['company_admin', 'accounting'].includes(profile.role)) {
        // Allowed
    } else if (profile.role === 'manager') {
        if (customer.assigned_user_id !== user.id) {
             const { data: teamMember } = await serviceClient
                .from('profiles')
                .select('id')
                .eq('id', customer.assigned_user_id)
                .eq('manager_id', user.id)
                .single()
            
            if (!teamMember) {
                 return { success: false, error: 'Sadece kendinize veya ekibinize ait müşterilere ödeme sözü ekleyebilirsiniz.', message: '' }
            }
        }
    } else if (profile.role === 'seller') {
        if (customer.assigned_user_id !== user.id) {
            return { success: false, error: 'Sadece kendinize ait müşterilere ödeme sözü ekleyebilirsiniz.', message: '' }
        }
    } else {
        return { success: false, error: 'Yetkisiz işlem', message: '' }
    }

    const { error } = await serviceClient.from('promises').insert({
        company_id: profile.company_id,
        customer_id: customerId,
        amount: amount,
        currency: currency,
        promise_date: promiseDate,
        status: 'pending', // pending, kept, broken
        note: note,
        created_by_user_id: user.id
    })

    if (error) {
        return { error: 'Söz eklenemedi: ' + error.message, success: false, message: '' }
    }

    revalidatePath(`/customers/${customerId}`)
    return { success: true, message: 'Ödeme sözü başarıyla eklendi.', error: '' }
}
