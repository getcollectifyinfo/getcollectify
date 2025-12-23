'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteUser(userId: string, email: string) {
    try {
        if (email.endsWith('@collectify.com')) {
            return { message: 'Varsayılan kullanıcılar silinemez.' }
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

        // Delete from Auth (this should cascade to profiles if configured, otherwise we might need to delete profile manually)
        // We will try deleting from Auth first.
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
            console.error('Error deleting user:', authError)
            return { message: 'Kullanıcı silinirken hata oluştu: ' + authError.message }
        }

        revalidatePath('/[domain]/users', 'page')
        return { success: true, message: 'Kullanıcı başarıyla silindi' }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { message: 'Beklenmeyen bir hata oluştu' }
    }
}
