'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createUserSchema = z.object({
    name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir email adresi giriniz'),
    role: z.string().min(1, 'Rol seçiniz'),
    manager_id: z.string().optional().nullable(),
    password: z.string().optional(),
})

export async function createUser(prevState: unknown, formData: FormData) {
    try {
        const rawData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            manager_id: formData.get('manager_id'),
            password: formData.get('password'),
        }

        const validatedFields = createUserSchema.safeParse({
            ...rawData,
            manager_id: rawData.manager_id === 'none' || !rawData.manager_id ? null : rawData.manager_id,
            password: rawData.password || undefined
        })

        if (!validatedFields.success) {
            return {
                errors: validatedFields.error.flatten().fieldErrors,
                message: 'Form verileri geçersiz'
            }
        }

        const { name, email, role, manager_id, password: providedPassword } = validatedFields.data

        const supabase = await createServerClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) return { message: 'Oturum açmanız gerekiyor' }

        // Use Service Role for database operations to bypass RLS policies
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

        // Get current company info using Admin client to ensure we can read it regardless of RLS
        const { data: currentProfile } = await supabaseAdmin
            .from('profiles')
            .select(`
                company_id,
                companies (
                    slug
                )
            `)
            .eq('id', currentUser.id)
            .single()

        if (!currentProfile) return { message: 'Profil bilgisi bulunamadı' }

        // Determine password
        // @ts-expect-error Supabase types mismatch for joins
        const isDemo = currentProfile.companies?.slug === 'demo' || currentProfile.companies?.slug?.startsWith('demo')
        const password = isDemo ? 'Demo1234' : (providedPassword || 'Temp1234!')

        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                name: name
            }
        })

        if (authError) {
            return { message: authError.message }
        }

        if (!authUser.user) {
            return { message: 'Kullanıcı oluşturulamadı' }
        }

        // 2. Create Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authUser.user.id,
                company_id: currentProfile.company_id,
                email: email,
                name: name,
                role: role,
                manager_id: manager_id || null,
                active: true
            })

        if (profileError) {
            // Cleanup: Delete auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            return { message: 'Profil oluşturulurken hata: ' + profileError.message }
        }

        revalidatePath('/users')
        return { success: true, message: 'Kullanıcı başarıyla oluşturuldu' }

    } catch (error) {
        console.error('Create user error:', error)
        return { message: 'Beklenmeyen bir hata oluştu' }
    }
}
