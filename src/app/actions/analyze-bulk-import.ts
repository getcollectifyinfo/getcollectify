'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

interface ImportRow {
    customerName: string
    dueDate: string | Date
    amount: number
    currency: string
    debtType: string
    salesRepName: string
    transactionDate?: string | Date
}

export interface AnalyzedRow {
    status: 'create' | 'update' | 'delete' | 'skip' | 'error'
    originalIndex?: number // -1 for deletions (not in excel)
    message?: string
    errorCode?: 'SALES_REP_NOT_FOUND' | 'CUSTOMER_NAME_EMPTY' | 'INVALID_DATE' | 'INVALID_AMOUNT'
    data: {
        customerName: string
        dueDate: string
        amount: number
        currency: string
        debtType: string
        salesRepName: string
    }
}

export interface AnalysisResult {
    success: boolean
    message: string
    rows: AnalyzedRow[]
    summary: {
        toCreate: number
        toUpdate: number
        toDelete: number
        toSkip: number
        errors: number
    }
}

export async function analyzeBulkImport(
    companyId: string, 
    rows: ImportRow[]
): Promise<AnalysisResult> {
    try {
        // 1. Initialize Clients
        const supabaseUser = await createClient()
        const { data: { user } } = await supabaseUser.auth.getUser()
        if (!user) return { 
            success: false, 
            message: 'Unauthorized', 
            rows: [], 
            summary: { toCreate: 0, toUpdate: 0, toDelete: 0, toSkip: 0, errors: 0 } 
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return { 
                success: false, 
                message: 'Server configuration error', 
                rows: [], 
                summary: { toCreate: 0, toUpdate: 0, toDelete: 0, toSkip: 0, errors: 0 } 
            }
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

        // 2. Fetch Data
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('company_id', companyId)
        
        if (usersError) throw new Error('Failed to fetch users')

        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('id, name')
            .eq('company_id', companyId)
        
        if (customersError) throw new Error('Failed to fetch customers')

        // IMPORTANT: Also fetch customer names for existing debts to display them nicely in deletions
        // But since we join on customer_id, we can map it.
        const { data: existingDebts, error: debtsError } = await supabase
            .from('debts')
            .select(`
                id, 
                customer_id, 
                due_date, 
                remaining_amount, 
                currency,
                debt_type,
                customers ( name )
            `)
            .eq('company_id', companyId)
            .eq('status', 'open')
        
        if (debtsError) throw new Error('Failed to fetch existing debts')

        // 3. Analyze Rows
        const analyzedRows: AnalyzedRow[] = []
        const summary = { toCreate: 0, toUpdate: 0, toDelete: 0, toSkip: 0, errors: 0 }
        const processedDebtIds = new Set<string>()
        
        const normalize = (s: string) => s?.trim().toLowerCase() || ''
        
        const formatDate = (d: string | Date) => {
            if (d instanceof Date) return d.toISOString().split('T')[0]
            try {
                return new Date(d).toISOString().split('T')[0]
            } catch {
                return null
            }
        }

        const findUser = (name: string) => {
            const n = normalize(name)
            return users.find(u => normalize(u.name) === n)
        }

        // Local cache of customers (simulate creation)
        // We only need names for matching
        const simulatedCustomers = [...customers]

        for (const [index, row] of rows.entries()) {
            const rowNum = index + 1
            const customerName = row.customerName?.trim()
            const dueDate = formatDate(row.dueDate)
            const amount = Number(row.amount)
            const salesRep = findUser(row.salesRepName)

            const rowData = {
                customerName: row.customerName,
                dueDate: row.dueDate as string,
                amount: row.amount,
                currency: row.currency,
                debtType: row.debtType,
                salesRepName: row.salesRepName
            }

            // Basic Validation
            if (!customerName) {
                analyzedRows.push({ status: 'error', originalIndex: index, message: 'Müşteri adı boş', data: rowData })
                summary.errors++
                continue
            }
            if (!dueDate) {
                analyzedRows.push({ status: 'error', originalIndex: index, message: 'Geçersiz vade tarihi', data: rowData })
                summary.errors++
                continue
            }
            if (isNaN(amount) || amount <= 0) {
                analyzedRows.push({ status: 'error', originalIndex: index, message: 'Geçersiz tutar', data: rowData })
                summary.errors++
                continue
            }
            if (!salesRep) {
                analyzedRows.push({ status: 'error', originalIndex: index, message: `Satış temsilcisi bulunamadı (${row.salesRepName})`, data: rowData })
                summary.errors++
                continue
            }

            // Match Customer
            let customer = simulatedCustomers.find(c => normalize(c.name) === normalize(customerName))
            
            // If new customer
            if (!customer) {
                // We assume it will be created
                customer = { id: `temp_${index}`, name: customerName } // Mock ID
                simulatedCustomers.push(customer)
            }

            // Match Debt
            // Logic: Same Customer + Same Due Date
            // Note: If customer is new (temp id), it won't match any existing debt
            const matchingDebt = existingDebts.find(d => 
                d.customer_id === customer?.id && 
                d.due_date === dueDate
            )

            if (matchingDebt) {
                processedDebtIds.add(matchingDebt.id)
                
                if (Number(matchingDebt.remaining_amount) === amount) {
                    analyzedRows.push({ status: 'skip', originalIndex: index, data: rowData })
                    summary.toSkip++
                } else {
                    analyzedRows.push({ 
                        status: 'update', 
                        originalIndex: index, 
                        message: `${matchingDebt.remaining_amount} -> ${amount}`,
                        data: rowData 
                    })
                    summary.toUpdate++
                }
            } else {
                analyzedRows.push({ status: 'create', originalIndex: index, data: rowData })
                summary.toCreate++
            }
        }

        // 4. Identify Deletions
        const debtsToDelete = existingDebts.filter(d => !processedDebtIds.has(d.id))
        
        for (const debt of debtsToDelete) {
            // @ts-expect-error Supabase types join
            const customerName = debt.customers?.name || 'Bilinmeyen Müşteri'
            
            analyzedRows.push({
                status: 'delete',
                originalIndex: -1,
                data: {
                    customerName: customerName,
                    dueDate: debt.due_date,
                    amount: debt.remaining_amount,
                    currency: debt.currency,
                    debtType: debt.debt_type || '-',
                    salesRepName: '-' // Not relevant for deletion
                }
            })
            summary.toDelete++
        }

        return {
            success: true,
            message: 'Analiz tamamlandı',
            rows: analyzedRows,
            summary
        }

    } catch (error) {
        console.error('Analysis error:', error)
        return { 
            success: false, 
            message: 'Analiz sırasında hata oluştu', 
            rows: [], 
            summary: { toCreate: 0, toUpdate: 0, toDelete: 0, toSkip: 0, errors: 0 } 
        }
    }
}