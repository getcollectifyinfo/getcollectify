'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
    Edit, 
    Trash2, 
    Search, 
    Filter, 
    ArrowUpDown, 
    Plus, 
    MoreHorizontal,
    Phone,
    User,
    Calendar
} from 'lucide-react'
import EditCustomerModal from '@/components/edit-customer-modal'
import { deleteCustomer } from '@/app/actions/delete-customer'
import { toast } from 'sonner'
import { differenceInDays, parseISO, max } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Debt {
    id: string
    remaining_amount: number
    due_date: string
    currency: string
}

interface Note {
    created_at: string
}

interface PromiseData {
    created_at: string
    promise_date: string
}

interface Customer {
    id: string
    name: string
    phone?: string | null
    created_at: string
    assigned_user_id?: string | null
    contact_person?: string | null // Assuming we might add this later or mock it
    profiles?: {
        name: string | null
    } | null
    debts: Debt[]
    notes: Note[]
    promises: PromiseData[]
}

interface CustomersClientProps {
    customers: Customer[]
    currentUserRole: string
}

type SortKey = 'name' | 'salesRep' | 'contact' | 'totalDebt' | 'overdueDebt' | 'maxDelay' | 'lastActivity' | 'riskLevel' | 'debtCount'
type SortDirection = 'asc' | 'desc'

export default function CustomersClient({ customers, currentUserRole }: CustomersClientProps) {
    const canManage = ['company_admin', 'accounting', 'manager'].includes(currentUserRole)
    const canAdd = ['company_admin', 'accounting'].includes(currentUserRole)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: SortDirection } | null>(null)
    
    const router = useRouter()

    const handleSort = (key: SortKey) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'asc' 
                    ? { key, direction: 'desc' } 
                    : null
            }
            return { key, direction: 'asc' }
        })
    }

    const processedCustomers = useMemo(() => {
        let result = customers.map(customer => {
            // Calculate computed fields
            const totalDebtByCurrency: Record<string, number> = {}
            const overdueDebtByCurrency: Record<string, number> = {}
            let maxDelay = 0
            
            customer.debts.forEach(debt => {
                // Total Debt
                if (!totalDebtByCurrency[debt.currency]) totalDebtByCurrency[debt.currency] = 0
                totalDebtByCurrency[debt.currency] += debt.remaining_amount

                // Overdue Debt & Delay
                if (debt.due_date) {
                    const dueDate = parseISO(debt.due_date)
                    const now = new Date()
                    if (dueDate < now) {
                        if (!overdueDebtByCurrency[debt.currency]) overdueDebtByCurrency[debt.currency] = 0
                        overdueDebtByCurrency[debt.currency] += debt.remaining_amount
                        
                        const days = differenceInDays(now, dueDate)
                        if (days > maxDelay) maxDelay = days
                    }
                }
            })

            // Last Activity
            const noteDates = customer.notes.map(n => parseISO(n.created_at))
            const promiseDates = customer.promises.map(p => parseISO(p.created_at)) // Or promise_date? Usually creation or the promise date itself. User said "Son girilen notun veya ödeme süresinin giriş tarihi" -> entry date.
            const allDates = [...noteDates, ...promiseDates]
            const lastActivity = allDates.length > 0 ? max(allDates) : null

            // Mock Risk Level
            let riskLevel: 'Yüksek' | 'Orta' | 'Düşük' = 'Düşük'
            if (maxDelay > 90) riskLevel = 'Yüksek'
            else if (maxDelay > 30) riskLevel = 'Orta'

            return {
                ...customer,
                totalDebtByCurrency,
                overdueDebtByCurrency,
                maxDelay,
                lastActivity,
                riskLevel,
                debtCount: customer.debts.length,
                salesRepName: customer.profiles?.name || '-',
                contactPerson: customer.contact_person || '-' // Placeholder
            }
        })

        // Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(c => 
                c.name.toLowerCase().includes(query) ||
                c.salesRepName.toLowerCase().includes(query)
            )
        }

        // Sort
        if (sortConfig) {
            result.sort((a, b) => {
                let comparison = 0
                
                switch (sortConfig.key) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name, 'tr')
                        break
                    case 'salesRep':
                        comparison = a.salesRepName.localeCompare(b.salesRepName, 'tr')
                        break
                    case 'contact':
                        comparison = a.contactPerson.localeCompare(b.contactPerson, 'tr')
                        break
                    case 'totalDebt':
                        // Simplify: Compare sum of all currencies (not accurate but sufficient for sorting mixed currencies visually)
                        const sumTotalA = Object.values(a.totalDebtByCurrency).reduce((sum, val) => sum + val, 0)
                        const sumTotalB = Object.values(b.totalDebtByCurrency).reduce((sum, val) => sum + val, 0)
                        comparison = sumTotalA - sumTotalB
                        break
                    case 'overdueDebt':
                        const sumOverdueA = Object.values(a.overdueDebtByCurrency).reduce((sum, val) => sum + val, 0)
                        const sumOverdueB = Object.values(b.overdueDebtByCurrency).reduce((sum, val) => sum + val, 0)
                        comparison = sumOverdueA - sumOverdueB
                        break
                    case 'maxDelay':
                        comparison = a.maxDelay - b.maxDelay
                        break
                    case 'lastActivity':
                        if (!a.lastActivity && !b.lastActivity) comparison = 0
                        else if (!a.lastActivity) comparison = -1
                        else if (!b.lastActivity) comparison = 1
                        else comparison = a.lastActivity.getTime() - b.lastActivity.getTime()
                        break
                    case 'riskLevel':
                        const riskScore = { 'Yüksek': 3, 'Orta': 2, 'Düşük': 1 }
                        comparison = riskScore[a.riskLevel] - riskScore[b.riskLevel]
                        break
                    case 'debtCount':
                        comparison = a.debtCount - b.debtCount
                        break
                }

                return sortConfig.direction === 'asc' ? comparison : -comparison
            })
        }

        return result
    }, [customers, searchQuery, sortConfig])

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer)
        setEditModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu müşteriyi ve ilişkili tüm borçları/notları silmek istediğinize emin misiniz?')) {
            return
        }

        const result = await deleteCustomer(id)
        if (result.success) {
            toast.success('Müşteri silindi')
            router.refresh()
        } else {
            toast.error(result.error || 'Silinirken hata oluştu')
        }
    }

    const formatCurrency = (amounts: Record<string, number>) => {
        const entries = Object.entries(amounts)
        if (entries.length === 0) return '-'
        return entries.map(([curr, amount]) => 
            new Intl.NumberFormat('tr-TR', { style: 'currency', currency: curr }).format(amount)
        ).join(', ')
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-1">
                <Card className="col-span-1">
                    <CardContent className="space-y-4">
                        {/* Filters & Actions */}
                        <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-4 rounded-lg border">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Müşteri veya temsilci ara..."
                                    className="pl-9 bg-background"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 justify-end">
                                {canAdd && (
                                    <Button asChild size="sm" className="gap-2">
                                        <Link href="/customers/new">
                                            <Plus className="h-4 w-4" />
                                            Yeni Müşteri
                                        </Link>
                                    </Button>
                                )}
                                <Button variant="outline" size="icon" className="shrink-0" title="Filtrele">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort('name')} className="hover:bg-transparent px-0 font-semibold">
                                                Müşteri <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort('salesRep')} className="hover:bg-transparent px-0 font-semibold">
                                                Satış Temsilcisi <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort('contact')} className="hover:bg-transparent px-0 font-semibold">
                                                Yetkili <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <div className="flex justify-end">
                                                <Button variant="ghost" onClick={() => handleSort('totalDebt')} className="hover:bg-transparent px-0 font-semibold">
                                                    Toplam Alacak <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <div className="flex justify-end">
                                                <Button variant="ghost" onClick={() => handleSort('overdueDebt')} className="hover:bg-transparent px-0 font-semibold">
                                                    Gecikmiş Alacak <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <Button variant="ghost" onClick={() => handleSort('maxDelay')} className="hover:bg-transparent px-0 font-semibold">
                                                Gecikme <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort('lastActivity')} className="hover:bg-transparent px-0 font-semibold">
                                                Son İşlem <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <Button variant="ghost" onClick={() => handleSort('riskLevel')} className="hover:bg-transparent px-0 font-semibold">
                                                Risk <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <Button variant="ghost" onClick={() => handleSort('debtCount')} className="hover:bg-transparent px-0 font-semibold">
                                                Adet <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processedCustomers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                                Müşteri bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        processedCustomers.map((customer) => (
                                            <TableRow key={customer.id} className="group hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    <Link href={`/customers/${customer.id}`} className="hover:underline flex items-center gap-2">
                                                        {customer.name}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {customer.phone || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{customer.salesRepName}</TableCell>
                                                <TableCell>{customer.contactPerson}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(customer.totalDebtByCurrency)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600 font-medium">
                                                    {formatCurrency(customer.overdueDebtByCurrency)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {customer.maxDelay > 0 ? (
                                                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                                                            {customer.maxDelay} Gün
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {customer.lastActivity ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">{customer.lastActivity.toLocaleDateString('tr-TR')}</span>
                                                            <span className="text-xs text-muted-foreground">{differenceInDays(new Date(), customer.lastActivity)} gün önce</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={`
                                                        ${customer.riskLevel === 'Yüksek' ? 'bg-red-500 hover:bg-red-600' : ''}
                                                        ${customer.riskLevel === 'Orta' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                                                        ${customer.riskLevel === 'Düşük' ? 'bg-green-500 hover:bg-green-600' : ''}
                                                    `}>
                                                        {customer.riskLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                    {customer.debtCount}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Menü aç</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/customers/${customer.id}`}>
                                                                    Detay Görüntüle
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Düzenle
                                                            </DropdownMenuItem>
                                                            {canManage && (
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleDelete(customer.id)}
                                                                    className="text-red-600 focus:text-red-600"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedCustomer && (
                <EditCustomerModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    customer={selectedCustomer}
                />
            )}
        </>
    )
}
