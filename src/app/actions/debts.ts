'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const debtSchema = z.object({
    customerId: z.string().uuid(),
    debtType: z.enum(['Cari', 'Çek', 'Senet']),
    dueDate: z.string(), // YYYY-MM-DD
    amount: z.coerce.number().positive('Tutar pozitif olmalıdır'),
    currency: z.enum(['TRY', 'USD', 'EUR']),
})

export async function createDebt(prevState: any, formData: FormData) {
    const validated = debtSchema.safeParse({
        customerId: formData.get('customerId'),
        debtType: formData.get('debtType'),
        dueDate: formData.get('dueDate'),
        amount: formData.get('amount'),
        currency: formData.get('currency'),
    })

    if (!validated.success) {
        return { error: 'Form hatalı: ' + JSON.stringify(validated.error.flatten().fieldErrors), success: false, message: '' }
    }

    const { customerId, debtType, dueDate, amount, currency } = validated.data
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum gerekli', success: false, message: '' }

    // Get company_id from profile
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil bulunamadı', success: false, message: '' }

    const { error } = await supabase.from('debts').insert({
        company_id: profile.company_id,
        customer_id: customerId,
        debt_type: debtType,
        due_date: dueDate,
        original_amount: amount,
        remaining_amount: amount,
        currency: currency,
        status: 'open'
    })

    if (error) {
        return { error: 'Borç eklenemedi: ' + error.message, success: false, message: '' }
    }

    revalidatePath(`/customers/${customerId}`)
    return { success: true, message: 'Borç başarıyla eklendi.', error: '' }
}
