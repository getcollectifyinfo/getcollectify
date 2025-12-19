'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const customerSchema = z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    phone: z.string().optional(),
})

export async function createCustomer(prevState: any, formData: FormData) {
    const validated = customerSchema.safeParse({
        name: formData.get('name'),
        phone: formData.get('phone'),
    })

    if (!validated.success) {
        return { error: 'Form hatalı.' }
    }

    const supabase = await createClient()

    // Determine company_id: handled by RLS automatically if using correct authenticated client.
    // Wait, for INSERT, we need to supply company_id usually if the policy demands it or if it's not defaulted.
    // BUT: "Insert/Update customers on customers for all using (company_id = get_my_company_id()) with check (company_id = get_my_company_id())"
    // This implies the user must PROVIDE the company_id in the insert payload that matches their own.

    // So we first need to get the user's company_id from their profile.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor.' }

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil bulunamadı.' }

    const { error } = await supabase.from('customers').insert({
        company_id: profile.company_id,
        name: validated.data.name,
        phone: validated.data.phone,
        assigned_user_id: user.id // Assign to creator by default? Or leave null. "seller" role logic applies.
    })

    if (error) {
        return { error: 'Müşteri oluşturulamadı: ' + error.message }
    }

    redirect('/customers')
}
