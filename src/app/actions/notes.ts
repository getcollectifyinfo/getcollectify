'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const noteSchema = z.object({
    customerId: z.string().uuid(),
    content: z.string().min(1, 'Not içeriği boş olamaz'),
})

export async function createNote(prevState: any, formData: FormData) {
    const validated = noteSchema.safeParse({
        customerId: formData.get('customerId'),
        content: formData.get('content'),
    })

    if (!validated.success) {
        return { error: 'Form hatalı: ' + JSON.stringify(validated.error.flatten().fieldErrors), success: false, message: '' }
    }

    const { customerId, content } = validated.data
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum gerekli', success: false, message: '' }

    // Get company_id from profile
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil bulunamadı', success: false, message: '' }

    const { error } = await supabase.from('notes').insert({
        company_id: profile.company_id,
        customer_id: customerId,
        content: content,
        created_by: user.id
    })

    if (error) {
        return { error: 'Not eklenemedi: ' + error.message, success: false, message: '' }
    }

    revalidatePath(`/customers/${customerId}`)
    return { success: true, message: 'Not başarıyla eklendi.', error: '' }
}
