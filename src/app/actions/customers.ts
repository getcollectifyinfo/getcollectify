'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const customerSchema = z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    phone: z.string().optional(),
})

export async function createCustomer(prevState: unknown, formData: FormData) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
        console.error('Auth Error:', authError)
        return { error: 'Oturum açmanız gerekiyor. Lütfen sayfayı yenileyip tekrar deneyin.' }
    }

    // Use Admin Client to bypass RLS recursion issues for profile fetch
    // Use DIRECT Supabase Client to avoid SSR/Cookie interference with Service Role
    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    
    const { data: profile, error: profileError } = await adminSupabase.from('profiles').select('company_id').eq('id', user.id).single()
    
    if (profileError || !profile) {
        console.error('Profile Error:', profileError)
        return { error: 'Profil bulunamadı. Lütfen yönetici ile iletişime geçin.' }
    }

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
