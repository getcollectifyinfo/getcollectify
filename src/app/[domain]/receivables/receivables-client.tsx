'use client'

import { useState, useEffect, Fragment, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, MessageSquareText, Edit, Trash2, CalendarCheck, UploadCloud, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import AddNoteModal from '@/components/add-note-modal'
import AddReceivableModal from '@/components/add-receivable-modal'
import EditDebtModal from '@/components/edit-debt-modal'
import BulkImportModal from '@/components/bulk-import-modal'
import CustomerTimeline from '@/components/customer-timeline'
import { getCustomerTimeline } from '@/app/actions/get-customer-timeline'
import { deleteDebt } from '@/app/actions/delete-debt'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { differenceInDays, parseISO } from 'date-fns'

interface Debt {
    id: string
    customer_id: string
    debt_type: string
    currency: string
    remaining_amount: number
    original_amount?: number
    due_date?: string
    dueDateFormatted: string
    isOverdue: boolean
    delayText: string
    customers?: {
        name: string
        profiles?: {
            name: string
        }
    }
    hasActivity?: boolean
}

interface User {
    id: string
    name: string
    role: string
}

interface ReceivablesClientProps {
    debts: Debt[]
    companyId: string
    debtTypes: string[]
    currencies: string[]
    users: User[]
    currentUserRole: string
}

export interface Note {
    id: string
    created_at: string
    contact_person: string
    phone: string
    text: string
    promised_date: string | null
    created_by_user_id: string
    debt_id?: string
    profiles: { name: string } | null
    debts?: {
        debt_type: string
        due_date: string
        remaining_amount: number
        currency: string
    } | null
}

export interface PromiseData {
    id: string
    created_at: string
    promised_date: string
    amount: number
    currency: string
    status: string
    created_by_user_id: string
    debt_id?: string
    profiles: { name: string } | null
}

interface TimelineData {
    notes: Note[]
    promises: PromiseData[]
}

export function ReceivablesClient({ debts, companyId, debtTypes, currencies, users, currentUserRole }: ReceivablesClientProps) {
    const canAddDebts = ['company_admin', 'accounting'].includes(currentUserRole)
    const canManageDebtItems = ['company_admin', 'accounting'].includes(currentUserRole) // Edit/Delete permission
    const [noteModalOpen, setNoteModalOpen] = useState(false)
    const [receivableModalOpen, setReceivableModalOpen] = useState(false)
    const [bulkImportOpen, setBulkImportOpen] = useState(false)
    const [editDebtModalOpen, setEditDebtModalOpen] = useState(false)
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
    const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
    const [timelineData, setTimelineData] = useState<Record<string, TimelineData>>({})
    const [loadingTimeline, setLoadingTimeline] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'current' | 'overdue'>('all')
    const router = useRouter()

    const groupedDebts = useMemo(() => {
        // First filter debts based on status
        const filteredDebts = debts.filter(debt => {
            if (statusFilter === 'all') return true
            if (statusFilter === 'overdue') return debt.isOverdue
            if (statusFilter === 'current') return !debt.isOverdue
            return true
        })

        const groups: Record<string, {
            customerId: string,
            customerName: string,
            salesRepName: string,
            debts: Debt[],
            totals: Record<string, number>,
            hasActivity: boolean,
            maxDelay: number
        }> = {}

        filteredDebts.forEach(debt => {
            if (!groups[debt.customer_id]) {
                groups[debt.customer_id] = {
                    customerId: debt.customer_id,
                    customerName: debt.customers?.name || 'Bilinmeyen Müşteri',
                    salesRepName: debt.customers?.profiles?.name || '-',
                    debts: [],
                    totals: {},
                    hasActivity: false,
                    maxDelay: 0
                }
            }
            groups[debt.customer_id].debts.push(debt)
            
            // Sum totals by currency
            if (!groups[debt.customer_id].totals[debt.currency]) {
                groups[debt.customer_id].totals[debt.currency] = 0
            }
            groups[debt.customer_id].totals[debt.currency] += debt.remaining_amount

            if (debt.hasActivity) {
                groups[debt.customer_id].hasActivity = true
            }

            if (debt.isOverdue && debt.due_date) {
                const days = differenceInDays(new Date(), parseISO(debt.due_date))
                if (days > groups[debt.customer_id].maxDelay) {
                    groups[debt.customer_id].maxDelay = days
                }
            }
        })

        let result = Object.values(groups)

        // Filter groups based on search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(group => 
                group.customerName.toLowerCase().includes(query) ||
                group.salesRepName.toLowerCase().includes(query)
            )
        }

        return result
    }, [debts, statusFilter, searchQuery])

    function openNoteModal(debt: Debt) {
        setSelectedDebt(debt)
        setNoteModalOpen(true)
    }

    function openEditModal(debt: Debt) {
        setSelectedDebt(debt)
        setEditDebtModalOpen(true)
    }

    async function handleDelete(debtId: string) {
        if (!window.confirm('Bu borcu silmek istediğinize emin misiniz?')) return
        
        try {
            const result = await deleteDebt(debtId)
            if (result.success) {
                toast.success('Borç silindi')
                router.refresh()
            } else {
                toast.error(result.error || 'Silme işlemi başarısız')
            }
        } catch {
            toast.error('Hata oluştu')
        }
    }

    async function toggleCustomerExpand(customerId: string) {
        const newExpanded = new Set(expandedCustomers)

        if (newExpanded.has(customerId)) {
            // Collapse
            newExpanded.delete(customerId)
        } else {
            // Expand - fetch timeline data if not already loaded
            newExpanded.add(customerId)

            if (!timelineData[customerId]) {
                setLoadingTimeline(prev => new Set(prev).add(customerId))
                const data = await getCustomerTimeline(customerId)
                setTimelineData(prev => ({ ...prev, [customerId]: data as unknown as TimelineData }))
                setLoadingTimeline(prev => {
                    const next = new Set(prev)
                    next.delete(customerId)
                    return next
                })
            }
        }

        setExpandedCustomers(newExpanded)
    }

    // Refresh timeline data when modal closes (note was added)
    useEffect(() => {
        if (!noteModalOpen && selectedDebt) {
            // Refresh timeline for the customer
            const customerId = selectedDebt.customer_id
            if (expandedCustomers.has(customerId)) {
                getCustomerTimeline(customerId).then(data => {
                    setTimelineData(prev => ({ ...prev, [customerId]: data as unknown as TimelineData }))
                })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noteModalOpen])

    return (
        <>
            <div className="grid gap-4 md:grid-cols-1">
                <Card className="col-span-1">
                    <CardHeader className="flex flex-col space-y-4 pb-4">
                        <div className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>Alacak Listesi & İşlem Takvimi</CardTitle>
                            <div className="flex gap-2">
                                {canAddDebts && (
                                    <>
                                        <Button variant="outline" onClick={() => setBulkImportOpen(true)} className="gap-2">
                                            <UploadCloud className="h-4 w-4" />
                                            Toplu Yükle (Excel)
                                        </Button>
                                        <Button onClick={() => setReceivableModalOpen(true)} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Alacak Ekle
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-4 rounded-lg border">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Müşteri veya satış temsilcisi ara..."
                                    className="pl-9 bg-background"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                <div className="flex items-center bg-muted p-1 rounded-lg">
                                    <Button
                                        variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className={`text-sm ${statusFilter === 'all' ? 'bg-background shadow-sm' : ''}`}
                                        onClick={() => setStatusFilter('all')}
                                    >
                                        Tümü
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'current' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className={`text-sm ${statusFilter === 'current' ? 'bg-background shadow-sm text-green-600' : ''}`}
                                        onClick={() => setStatusFilter('current')}
                                    >
                                        Gelecek
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'overdue' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className={`text-sm ${statusFilter === 'overdue' ? 'bg-background shadow-sm text-red-600' : ''}`}
                                        onClick={() => setStatusFilter('overdue')}
                                    >
                                        Geçmiş
                                    </Button>
                                </div>
                                <Button variant="outline" size="icon" className="shrink-0" title="Filtrele">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Müşteri</TableHead>
                                    <TableHead>Satış Temsilcisi</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">Toplam Tutar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedDebts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            Açık borç bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    groupedDebts.map((group) => {
                                        const isExpanded = expandedCustomers.has(group.customerId)
                                        const isLoading = loadingTimeline.has(group.customerId)

                                        return (
                                            <Fragment key={group.customerId}>
                                                <TableRow 
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => toggleCustomerExpand(group.customerId)}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4" />
                                                            )}
                                                            {group.customerName}
                                                            {group.hasActivity && (
                                                                <MessageSquareText className="w-4 h-4 text-blue-500 ml-1" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.salesRepName}
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.maxDelay > 0 ? (
                                                            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                                                                {group.maxDelay} Gün Gecikme
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                                Güncel
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {Object.entries(group.totals).map(([currency, amount]) => (
                                                            <div key={currency}>
                                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency }).format(amount)}
                                                            </div>
                                                        ))}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded timeline row */}
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="p-0 bg-muted/10">
                                                            <div className="p-6">
                                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                                                    {/* Left Side: Debt List (8 cols) */}
                                                                    <div className="lg:col-span-8 space-y-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                                                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                                                                Açık Borçlar
                                                                            </h3>
                                                                            <div className="text-sm text-muted-foreground">
                                                                                {group.debts.length} adet borç
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <Card>
                                                                            <Table>
                                                                                <TableHeader>
                                                                                    <TableRow className="bg-muted/50">
                                                                                        <TableHead>Borç Tipi</TableHead>
                                                                                        <TableHead>Vade Tarihi</TableHead>
                                                                                        <TableHead>Durum</TableHead>
                                                                                        <TableHead className="text-right">Tutar</TableHead>
                                                                                        <TableHead className="text-right w-[100px]">İşlem</TableHead>
                                                                                    </TableRow>
                                                                                </TableHeader>
                                                                                <TableBody>
                                                                                    {group.debts.map(debt => (
                                                                                        <TableRow key={debt.id} className="hover:bg-muted/20">
                                                                                            <TableCell>
                                                                                                <Badge variant="outline" className="font-normal">
                                                                                                    {debt.debt_type}
                                                                                                </Badge>
                                                                                            </TableCell>
                                                                                            <TableCell className="font-medium">
                                                                                                {debt.dueDateFormatted}
                                                                                            </TableCell>
                                                                                            <TableCell>
                                                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                                                    debt.isOverdue 
                                                                                                        ? 'bg-red-100 text-red-800' 
                                                                                                        : 'bg-green-100 text-green-800'
                                                                                                }`}>
                                                                                                    {debt.delayText}
                                                                                                </span>
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right font-bold font-mono">
                                                                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: debt.currency }).format(debt.remaining_amount)}
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right">
                                                                                                <div className="flex justify-end items-center gap-1">
                                                                                                    <Button
                                                                                                        size="icon"
                                                                                                        variant="ghost"
                                                                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                                                        title="Not Ekle"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation()
                                                                                                            openNoteModal(debt)
                                                                                                        }}
                                                                                                    >
                                                                                                        <MessageSquareText className="h-4 w-4" />
                                                                                                    </Button>
                                                                                                    {canManageDebtItems && (
                                                                                                        <>
                                                                                                            <Button
                                                                                                                size="icon"
                                                                                                                variant="ghost"
                                                                                                                className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                                                                                                title="Düzenle"
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation()
                                                                                                                    openEditModal(debt)
                                                                                                                }}
                                                                                                            >
                                                                                                                <Edit className="h-4 w-4" />
                                                                                                            </Button>
                                                                                                            <Button
                                                                                                                size="icon"
                                                                                                                variant="ghost"
                                                                                                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                                                                                                title="Sil"
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation()
                                                                                                                    handleDelete(debt.id)
                                                                                                                }}
                                                                                                            >
                                                                                                                <Trash2 className="h-4 w-4" />
                                                                                                            </Button>
                                                                                                        </>
                                                                                                    )}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </Card>
                                                                    </div>

                                                                    {/* Right Side: Timeline (4 cols) */}
                                                                    <div className="lg:col-span-4 space-y-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                                                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                                                                İşlem Geçmişi
                                                                            </h3>
                                                                        </div>
                                                                        
                                                                        <Card className="h-full max-h-[500px] overflow-y-auto">
                                                                            {isLoading ? (
                                                                                <div className="flex items-center justify-center h-40 text-muted-foreground">
                                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                                                                                    Yükleniyor...
                                                                                </div>
                                                                            ) : timelineData[group.customerId] ? (
                                                                                <CustomerTimeline
                                                                                    notes={timelineData[group.customerId].notes}
                                                                                    promises={timelineData[group.customerId].promises}
                                                                                />
                                                                            ) : (
                                                                                <div className="p-8 text-center text-muted-foreground">
                                                                                    İşlem geçmişi bulunamadı.
                                                                                </div>
                                                                            )}
                                                                        </Card>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {selectedDebt && (
                <AddNoteModal
                    open={noteModalOpen}
                    onOpenChange={setNoteModalOpen}
                    customerId={selectedDebt.customer_id}
                    debtId={selectedDebt.id}
                    debtAmount={selectedDebt.remaining_amount}
                    currency={selectedDebt.currency}
                />
            )}

            <AddReceivableModal
                open={receivableModalOpen}
                onOpenChange={setReceivableModalOpen}
                companyId={companyId}
                debtTypes={debtTypes}
                currencies={currencies}
                users={users}
            />

            <BulkImportModal 
                open={bulkImportOpen} 
                onOpenChange={setBulkImportOpen}
                companyId={companyId}
            />

            {selectedDebt && (
                <EditDebtModal
                    open={editDebtModalOpen}
                    onOpenChange={setEditDebtModalOpen}
                    debt={selectedDebt}
                    debtTypes={debtTypes}
                    currencies={currencies}
                />
            )}
        </>
    )
}
