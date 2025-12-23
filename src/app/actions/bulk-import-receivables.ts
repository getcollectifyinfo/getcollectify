'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ImportRow {
    customerName: string
    dueDate: string | Date
    amount: number
    currency: string
    debtType: string
    salesRepName: string
    transactionDate?: string | Date
}

interface ImportResult {
    success: boolean
    message: string
    stats?: {
        created: number
        updated: number
        deleted: number
        skipped: number
    }
    errors?: string[]
}

export async function bulkImportReceivables(
    companyId: string, 
    rows: ImportRow[]
): Promise<ImportResult> {
    try {
        console.log(`Starting bulk import for company ${companyId} with ${rows.length} rows`)
        
        // 1. Initialize Clients
        // User client for auth check
        const supabaseUser = await createClient()
        const { data: { user } } = await supabaseUser.auth.getUser()
        if (!user) return { success: false, message: 'Unauthorized' }

        // Service client for bypassing RLS and performing bulk operations
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return { success: false, message: 'Server configuration error' }
        }
        
        const supabase = createServiceClient(
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
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !['company_admin', 'accounting'].includes(profile.role)) {
            return { success: false, message: 'Bu işlem için yetkiniz yok' }
        }

        // 2. Fetch all necessary data for validation and matching
        
        // Fetch Users (Sales Reps)
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('company_id', companyId)
        
        if (usersError) return { success: false, message: 'Failed to fetch users' }

        // Fetch Existing Customers
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('id, name, assigned_user_id')
            .eq('company_id', companyId)
        
        if (customersError) return { success: false, message: 'Failed to fetch customers' }

        // Fetch Existing Debts (Only OPEN ones to be safe, or all?)
        // The requirement says: "Bu tabloda olmayan ama kayıtlarda olan varsa o kayıt silinecek."
        // We should strictly target 'open' debts to avoid deleting historical closed/archived data.
        const { data: existingDebts, error: debtsError } = await supabase
            .from('debts')
            .select('id, customer_id, due_date, remaining_amount, original_amount, currency')
            .eq('company_id', companyId)
            .eq('status', 'open') // SAFETY: Only sync open debts
        
        if (debtsError) return { success: false, message: 'Failed to fetch existing debts' }

        // 3. Process Rows
        const stats = { created: 0, updated: 0, deleted: 0, skipped: 0 }
        const errors: string[] = []
        const processedDebtIds = new Set<string>()
        
        // Helper to normalize strings
        const normalize = (s: string) => s?.trim().toLowerCase() || ''
        
        // Helper to format date YYYY-MM-DD
        const formatDate = (d: string | Date) => {
            if (d instanceof Date) return d.toISOString().split('T')[0]
            try {
                return new Date(d).toISOString().split('T')[0]
            } catch {
                return null
            }
        }

        // Helper to find user by name
        const findUser = (name: string) => {
            const n = normalize(name)
            return users.find(u => normalize(u.name) === n)
        }

        for (const [index, row] of rows.entries()) {
            const rowNum = index + 1
            const customerName = row.customerName?.trim()
            if (!customerName) {
                errors.push(`Row ${rowNum}: Müşteri adı boş`)
                continue
            }

            const dueDate = formatDate(row.dueDate)
            if (!dueDate) {
                errors.push(`Row ${rowNum}: Geçersiz vade tarihi`)
                continue
            }

            const amount = Number(row.amount)
            if (isNaN(amount) || amount <= 0) {
                errors.push(`Row ${rowNum}: Geçersiz tutar`)
                continue
            }

            // Find Sales Rep
            const salesRep = findUser(row.salesRepName)
            if (!salesRep) {
                errors.push(`Row ${rowNum}: Satış temsilcisi bulunamadı (${row.salesRepName})`)
                continue
            }

            // Find or Create Customer
            let customerId = customers.find(c => normalize(c.name) === normalize(customerName))?.id
            
            if (!customerId) {
                // Create new customer
                const { data: newCustomer, error: createCustError } = await supabase
                    .from('customers')
                    .insert({
                        company_id: companyId,
                        name: customerName,
                        assigned_user_id: salesRep.id
                    })
                    .select('id')
                    .single()
                
                if (createCustError) {
                    errors.push(`Row ${rowNum}: Müşteri oluşturulamadı - ${createCustError.message}`)
                    continue
                }
                customerId = newCustomer.id
                // Add to local cache
                customers.push({ id: customerId, name: customerName, assigned_user_id: salesRep.id })
            }

            // Check against existing debts
            // Logic: Same Customer + Same Due Date
            const matchingDebt = existingDebts.find(d => 
                d.customer_id === customerId && 
                d.due_date === dueDate
            )

            if (matchingDebt) {
                processedDebtIds.add(matchingDebt.id)
                
                // Rule 1: Same Amount -> Skip
                if (Number(matchingDebt.remaining_amount) === amount) {
                    stats.skipped++
                    continue
                }

                // Rule 2: Different Amount -> Update
                // Note: We update both original and remaining amount to keep them in sync for this import logic
                const { error: updateError } = await supabase
                    .from('debts')
                    .update({
                        remaining_amount: amount,
                        original_amount: amount, // Assuming import reflects current state
                        currency: row.currency, // Update currency too just in case
                        debt_type: row.debtType
                    })
                    .eq('id', matchingDebt.id)

                if (updateError) {
                    errors.push(`Row ${rowNum}: Güncelleme hatası - ${updateError.message}`)
                } else {
                    stats.updated++
                }
            } else {
                // Rule 3 & 4: Create new debt
                const { data: newDebt, error: createDebtError } = await supabase
                    .from('debts')
                    .insert({
                        company_id: companyId,
                        customer_id: customerId,
                        due_date: dueDate,
                        original_amount: amount,
                        remaining_amount: amount,
                        currency: row.currency,
                        debt_type: row.debtType,
                        status: 'open',
                        created_at: row.transactionDate ? new Date(row.transactionDate).toISOString() : undefined
                    })
                    .select('id')
                    .single()

                if (createDebtError) {
                    errors.push(`Row ${rowNum}: Kayıt hatası - ${createDebtError.message}`)
                } else {
                    if (newDebt) processedDebtIds.add(newDebt.id)
                    stats.created++
                }
            }
        }

        // 4. Rule 5: Delete missing records
        // Only delete debts that were in 'existingDebts' (open status) but NOT in 'processedDebtIds'
        const debtsToDelete = existingDebts.filter(d => !processedDebtIds.has(d.id))
        
        if (debtsToDelete.length > 0) {
            const idsToDelete = debtsToDelete.map(d => d.id)

            // Explicitly delete related records first to avoid FK constraints
            // if ON DELETE CASCADE is missing or fails
            await supabase.from('promises').delete().in('debt_id', idsToDelete)
            await supabase.from('notes').delete().in('debt_id', idsToDelete)
            await supabase.from('payments').delete().in('debt_id', idsToDelete)

            const { error: deleteError } = await supabase
                .from('debts')
                .delete()
                .in('id', idsToDelete)
            
            if (deleteError) {
                errors.push(`Silme işlemi hatası: ${deleteError.message}`)
            } else {
                stats.deleted = idsToDelete.length
            }
        }

        revalidatePath('/receivables')
        
        return {
            success: errors.length === 0 || stats.created > 0 || stats.updated > 0 || stats.deleted > 0,
            message: errors.length > 0 ? 'Bazı hatalar oluştu' : 'İşlem başarıyla tamamlandı',
            stats,
            errors
        }

    } catch (error) {
        console.error('Bulk import error:', error)
        return { success: false, message: 'Beklenmeyen bir hata oluştu' }
    }
}
