'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSiteUrl } from '@/lib/utils'

const signupSchema = z.object({
    companyName: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır'),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire kullanılabilir'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

// NEEDED: Admin client for creating company and profile without RLS issues initially
// Or secure it properly. For now, we use service role key if available, but exposing it safely via server action.
const createAdminClient = async () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            }
        }
    )
}

export async function signup(prevState: any, formData: FormData) {
    const validated = signupSchema.safeParse(Object.fromEntries(formData))

    if (!validated.success) {
        return { error: 'Form hatalı. Lütfen bilgileri kontrol ediniz.', fields: validated.error.flatten().fieldErrors }
    }

    const { companyName, slug, email, password } = validated.data
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    // 1. Check if slug exists
    const { data: existing } = await supabaseAdmin.from('companies').select('id').eq('slug', slug).single()
    if (existing) {
        return { error: 'Bu alan adı (slug) zaten kullanımda.' }
    }

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'company_admin', // Metadata
            }
        }
    })

    if (authError || !authData.user) {
        return { error: authError?.message || 'Kayıt oluşturulamadı.' }
    }

    // 3. Create Company
    const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
            name: companyName,
            slug: slug,
            base_currency: 'TRY' // Default
        })
        .select()
        .single()

    if (companyError) {
        // Rollback? Auth user is created but company failed. ideally use transaction or cleanup.
        return { error: 'Şirket oluşturulamadı: ' + companyError.message }
    }

    // 4. Create Profile
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: authData.user.id,
            company_id: company.id,
            email: email,
            role: 'company_admin',
            name: companyName // Default admin name to company name or ask for it
        })

    if (profileError) {
        return { error: 'Profil oluşturulamadı: ' + profileError.message }
    }

    // Login happens automatically?
    // Actually, we might need to redirect to their subdomain to login.
    // Or if we are in root domain, we can't set cookies for subdomain easily without wildcard cookie config.
    // For MVP, redirect to the subdomain login page.

    const redirectUrl = getSiteUrl(slug, '/login')

    redirect(redirectUrl)
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    
    const target = getSiteUrl()

    redirect(target)
}

export async function login(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Giriş yapılamadı. Bilgilerinizi kontrol edin.' }
    }

    // Redirect logic: handled by client or here?
    // If login is successful, we are on the tenant domain, so session is set.
    redirect('/')
}
