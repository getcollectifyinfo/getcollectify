'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Plus } from 'lucide-react'
import AddNoteModal from '@/components/add-note-modal'
import AddReceivableModal from '@/components/add-receivable-modal'
import CustomerTimeline from '@/components/customer-timeline'
import { getCustomerTimeline } from '@/app/actions/get-customer-timeline'

interface Debt {
    id: string
    customer_id: string
    debt_type: string
    currency: string
    remaining_amount: number
    dueDateFormatted: string
    isOverdue: boolean
    delayText: string
    customers?: {
        name: string
    }
}

interface ReceivablesClientProps {
    debts: Debt[]
    companyId: string
    debtTypes: string[]
    currencies: string[]
}

interface TimelineData {
    notes: any[]
    promises: any[]
}

export function ReceivablesClient({ debts, companyId, debtTypes, currencies }: ReceivablesClientProps) {
    const [noteModalOpen, setNoteModalOpen] = useState(false)
    const [receivableModalOpen, setReceivableModalOpen] = useState(false)
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
    const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
    const [timelineData, setTimelineData] = useState<Record<string, TimelineData>>({})
    const [loadingTimeline, setLoadingTimeline] = useState<Set<string>>(new Set())

    function openNoteModal(debt: Debt) {
        setSelectedDebt(debt)
        setNoteModalOpen(true)
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
                setTimelineData(prev => ({ ...prev, [customerId]: data }))
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
                    setTimelineData(prev => ({ ...prev, [customerId]: data }))
                })
            }
        }
    }, [noteModalOpen])

    return (
        <>
            <div className="grid gap-4 md:grid-cols-1">
                <Card className="col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle>Alacak Listesi & İşlem Takvimi</CardTitle>
                        <Button onClick={() => setReceivableModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Alacak Ekle
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Müşteri</TableHead>
                                    <TableHead>Borç Tipi</TableHead>
                                    <TableHead>Vade Tarihi</TableHead>
                                    <TableHead>Gecikme</TableHead>
                                    <TableHead className="text-right">Tutar</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {debts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Açık borç bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    debts.map((debt) => {
                                        const isExpanded = expandedCustomers.has(debt.customer_id)
                                        const isLoading = loadingTimeline.has(debt.customer_id)

                                        return (
                                            <>
                                                <TableRow key={debt.id}>
                                                    <TableCell className="font-medium">
                                                        <button
                                                            onClick={() => toggleCustomerExpand(debt.customer_id)}
                                                            className="flex items-center gap-2 hover:underline text-blue-600"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4" />
                                                            )}
                                                            {debt.customers?.name || 'Bilinmeyen Müşteri'}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{debt.debt_type}</Badge>
                                                    </TableCell>
                                                    <TableCell>{debt.dueDateFormatted}</TableCell>
                                                    <TableCell>
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${debt.isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                            {debt.delayText}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: debt.currency }).format(debt.remaining_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => openNoteModal(debt)}
                                                        >
                                                            Not Ekle
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded timeline row */}
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="p-0 bg-muted/30">
                                                            {isLoading ? (
                                                                <div className="py-8 text-center text-sm text-muted-foreground">
                                                                    Yükleniyor...
                                                                </div>
                                                            ) : timelineData[debt.customer_id] ? (
                                                                <CustomerTimeline
                                                                    notes={timelineData[debt.customer_id].notes}
                                                                    promises={timelineData[debt.customer_id].promises}
                                                                />
                                                            ) : null}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
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
            />
        </>
    )
}
