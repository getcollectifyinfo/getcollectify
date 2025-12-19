'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadImportFile(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'Dosya seçilmedi' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum gerekli' }

    // Get company_id from profile
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil bulunamadı' }

    // 1. Log Job
    const { data: job, error: jobError } = await supabase.from('import_jobs').insert({
        company_id: profile.company_id,
        filename: file.name,
        status: 'processing',
        created_by_user_id: user.id
    }).select().single()

    if (jobError) return { error: 'Job başlatılamadı: ' + jobError.message }

    // 2. Parse CSV (Simple parsing for MVP)
    // Note: Streaming or large file handling is skipped for simple MVP.
    try {
        const text = await file.text()
        const lines = text.split('\n').filter(l => l.trim().length > 0)

        // Assume Header: Name, Phone, DebtAmount, DueDate
        // Skip 1st line if header
        const rows = lines.slice(1)
        let insertedCount = 0

        for (const row of rows) {
            const cols = row.split(',')
            if (cols.length < 2) continue

            const name = cols[0]?.trim()
            const phone = cols[1]?.trim()
            const amount = parseFloat(cols[2]?.trim() || '0')
            const dueDate = cols[3]?.trim()

            if (!name) continue

            // Insert Customer
            const { data: customer, error: custError } = await supabase.from('customers').insert({
                company_id: profile.company_id,
                name: name,
                phone: phone
            }).select().single()

            if (custError) continue

            // Insert Debt if amount > 0
            if (amount > 0 && customer) {
                await supabase.from('debts').insert({
                    company_id: profile.company_id,
                    customer_id: customer.id,
                    debt_type: 'Cari',
                    due_date: dueDate || new Date().toISOString(),
                    original_amount: amount,
                    remaining_amount: amount,
                    currency: 'TRY',
                    status: 'open'
                })
            }
            insertedCount++
        }

        await supabase.from('import_jobs').update({
            status: 'completed',
            inserted_count: insertedCount
        }).eq('id', job.id)

        revalidatePath('/import')
        return { message: `${insertedCount} kayıt başarıyla işlendi.` }

    } catch (err: any) {
        await supabase.from('import_jobs').update({
            status: 'failed',
            error_text: err.message
        }).eq('id', job.id)
        return { error: 'İşlem hatası: ' + err.message }
    }
}
