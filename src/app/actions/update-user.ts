'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const updateUserSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir email adresi giriniz'),
    role: z.string().min(1, 'Rol seçiniz'),
    manager_id: z.string().optional().nullable(),
})

export async function updateUser(prevState: unknown, formData: FormData) {
    try {
        const rawData = {
            id: formData.get('id'),
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            manager_id: formData.get('manager_id'),
        }

        const validatedFields = updateUserSchema.safeParse({
            ...rawData,
            manager_id: rawData.manager_id === 'none' || !rawData.manager_id ? null : rawData.manager_id,
        })

        if (!validatedFields.success) {
            return {
                errors: validatedFields.error.flatten().fieldErrors,
                message: 'Form verileri geçersiz'
            }
        }

        const { id, name, email, role, manager_id } = validatedFields.data

        if (email.endsWith('@collectify.com')) {
            return { message: 'Varsayılan kullanıcılar düzenlenemez.' }
        }

        const supabase = await createServerClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) return { message: 'Oturum açmanız gerekiyor' }

        // Use Service Role for Admin Auth operations
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return { message: 'Server configuration error: Missing Service Role Key' }
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Update Auth User (Email and Metadata)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            email: email,
            email_confirm: true, // Auto confirm if changing email
            user_metadata: {
                name: name
            }
        })

        if (authError) {
            return { message: 'Auth güncelleme hatası: ' + authError.message }
        }

        // 2. Update Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                name: name,
                email: email,
                role: role,
                manager_id: manager_id
            })
            .eq('id', id)

        if (profileError) {
            return { message: 'Profil güncelleme hatası: ' + profileError.message }
        }

        revalidatePath('/[domain]/users', 'page')
        return { success: true, message: 'Kullanıcı başarıyla güncellendi' }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { message: 'Beklenmeyen bir hata oluştu' }
    }
}
