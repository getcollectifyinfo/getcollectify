'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const companySchema = z.object({
    name: z.string().min(1, 'Firma adı boş olamaz'),
    baseCurrency: z.enum(['TRY', 'USD', 'EUR']),
    timezone: z.string(),
    logoUrl: z.string().url().optional().or(z.literal('')),
})

export async function updateCompanySettings(prevState: unknown, formData: FormData) {
    const validated = companySchema.safeParse({
        name: formData.get('name'),
        baseCurrency: formData.get('baseCurrency'),
        timezone: formData.get('timezone'),
        logoUrl: formData.get('logoUrl'),
    })

    if (!validated.success) {
        return { error: 'Form hatalı: ' + JSON.stringify(validated.error.flatten().fieldErrors), success: false, message: '' }
    }

    const { name, baseCurrency, timezone, logoUrl } = validated.data
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum gerekli', success: false, message: '' }

    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()

    if (!profile || profile.role !== 'company_admin') {
        return { error: 'Kayıt için Şirket Admini Rolünü seçmelisiniz', success: false, message: '' }
    }

    const { error } = await supabase.from('companies').update({
        name: name,
        base_currency: baseCurrency,
        timezone: timezone,
        logo_url: logoUrl || null
    }).eq('id', profile.company_id)

    if (error) {
        return { error: 'Güncelleme başarısız: ' + error.message, success: false, message: '' }
    }

    revalidatePath('/settings')
    return { success: true, message: 'Ayarlar güncellendi.', error: '' }
}

const fxRateSchema = z.object({
    date: z.string(),
    baseCurrency: z.string(),
    quoteCurrency: z.string(),
    rate: z.coerce.number().positive(),
})

export async function addFxRate(prevState: unknown, formData: FormData) {
    const validated = fxRateSchema.safeParse({
        date: formData.get('date'),
        baseCurrency: formData.get('baseCurrency'),
        quoteCurrency: formData.get('quoteCurrency'),
        rate: formData.get('rate'),
    })

    if (!validated.success) {
        return { error: 'Hata: ' + JSON.stringify(validated.error.flatten().fieldErrors), success: false, message: '' }
    }

    const { date, baseCurrency, quoteCurrency, rate } = validated.data
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum gerekli', success: false, message: '' }

    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'company_admin') {
        return { error: 'Yetkiniz yok', success: false, message: '' }
    }

    const { error } = await supabase.from('fx_rates').insert({
        company_id: profile.company_id,
        date: date,
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        rate: rate
    })

    if (error) {
        return { error: 'Kur eklenemedi: ' + error.message, success: false, message: '' }
    }

    revalidatePath('/settings')
    return { success: true, message: 'Kur eklendi.', error: '' }
}
