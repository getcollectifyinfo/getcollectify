'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateCustomerSchema = z.object({
    customerId: z.string().uuid(),
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    phone: z.string().optional(),
})

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

export async function updateCustomer(input: UpdateCustomerInput) {
    const validated = updateCustomerSchema.safeParse(input)
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Oturum açmanız gerekiyor' }
    }

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

    // Check user role
    const { data: profile } = await serviceClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return { success: false, error: 'Profil bulunamadı' }
    }

    // Check customer ownership
    const { data: customer } = await serviceClient
        .from('customers')
        .select('assigned_user_id')
        .eq('id', input.customerId)
        .single()

    if (!customer) {
        return { success: false, error: 'Müşteri bulunamadı' }
    }

    // Permission Logic
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
                return { success: false, error: 'Sadece kendinize veya ekibinize ait müşterileri düzenleyebilirsiniz.' }
            }
        }
    } else if (profile.role === 'seller') {
        if (customer.assigned_user_id !== user.id) {
            return { success: false, error: 'Sadece kendinize ait müşterileri düzenleyebilirsiniz.' }
        }
    } else {
        return { success: false, error: 'Yetkisiz işlem' }
    }

    const { error } = await serviceClient
        .from('customers')
        .update({
            name: input.name,
            phone: input.phone,
        })
        .eq('id', input.customerId)

    if (error) {
        console.error('Error updating customer:', error)
        return { success: false, error: 'Müşteri güncellenirken hata oluştu' }
    }

    revalidatePath('/customers')
    return { success: true }
}
