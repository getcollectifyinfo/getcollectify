'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const promiseSchema = z.object({
    customerId: z.string().uuid(),
    amount: z.coerce.number().positive('Tutar pozitif olmalıdır'),
    currency: z.enum(['TRY', 'USD', 'EUR']),
    promiseDate: z.string(), // YYYY-MM-DD
    note: z.string().optional(),
})

export async function createPromise(prevState: any, formData: FormData) {
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

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil bulunamadı', success: false, message: '' }

    const { error } = await supabase.from('promises').insert({
        company_id: profile.company_id,
        customer_id: customerId,
        amount: amount,
        currency: currency,
        promise_date: promiseDate,
        status: 'pending', // pending, kept, broken
        note: note,
        created_by: user.id
    })

    if (error) {
        return { error: 'Söz eklenemedi: ' + error.message, success: false, message: '' }
    }

    revalidatePath(`/customers/${customerId}`)
    return { success: true, message: 'Ödeme sözü başarıyla eklendi.', error: '' }
}
