'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const paymentSchema = z.object({
    customerId: z.string().uuid(),
    amount: z.coerce.number().positive('Tutar pozitif olmalıdır'),
    currency: z.enum(['TRY', 'USD', 'EUR']),
    paymentDate: z.string(),
    paymentMethod: z.enum(['Nakit', 'Havale/EFT', 'Kredi Kartı', 'Çek']),
    reference: z.string().optional(),
})

export async function createPayment(prevState: any, formData: FormData) {
    const validated = paymentSchema.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        currency: formData.get('currency'),
        paymentDate: formData.get('paymentDate'),
        paymentMethod: formData.get('paymentMethod'),
        reference: formData.get('reference'),
    })

    if (!validated.success) {
        return { error: 'Form hatalı: ' + JSON.stringify(validated.error.flatten().fieldErrors), success: false, message: '' }
    }

    const { customerId, amount, currency, paymentDate, paymentMethod, reference } = validated.data
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum gerekli', success: false, message: '' }

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil bulunamadı', success: false, message: '' }

    // 1. Create Payment Record
    const { data: payment, error: paymentError } = await supabase.from('payments').insert({
        company_id: profile.company_id,
        customer_id: customerId,
        amount: amount,
        currency: currency,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference: reference
    }).select().single()

    if (paymentError) {
        return { error: 'Tahsilat eklenemedi: ' + paymentError.message, success: false, message: '' }
    }

    // 2. Allocate Payment to Open Debts (FIFO)
    const { data: openDebts } = await supabase
        .from('debts')
        .select('*')
        .eq('customer_id', customerId)
        .eq('currency', currency)
        .gt('remaining_amount', 0)
        .order('due_date', { ascending: true })

    let remainingPayment = amount

    if (openDebts) {
        for (const debt of openDebts) {
            if (remainingPayment <= 0) break

            const deduction = Math.min(debt.remaining_amount, remainingPayment)
            const newRemaining = debt.remaining_amount - deduction
            const newStatus = newRemaining <= 0 ? 'paid' : 'partial'

            const { error: updateError } = await supabase
                .from('debts')
                .update({
                    remaining_amount: newRemaining,
                    status: newStatus
                })
                .eq('id', debt.id)

            if (!updateError) {
                remainingPayment -= deduction
            }
        }
    }

    revalidatePath(`/customers/${customerId}`)
    return { success: true, message: 'Tahsilat başarıyla eklendi ve borçlardan düşüldü.', error: '' }
}
