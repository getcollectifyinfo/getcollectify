'use client'

import { useState } from 'react'
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
import AddNoteModal from '@/components/add-note-modal'

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

interface DashboardClientProps {
    debts: Debt[]
}

export function DashboardClient({ debts }: DashboardClientProps) {
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)

    function openNoteModal(debt: Debt) {
        setSelectedDebt(debt)
        setModalOpen(true)
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-1">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Alacak Listesi & İşlem Takvimi</CardTitle>
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
                                    debts.map((debt) => (
                                        <TableRow key={debt.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/customers/${debt.customer_id}`} className="hover:underline text-blue-600">
                                                    {debt.customers?.name || 'Bilinmeyen Müşteri'}
                                                </Link>
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {selectedDebt && (
                <AddNoteModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    customerId={selectedDebt.customer_id}
                    debtId={selectedDebt.id}
                    debtAmount={selectedDebt.remaining_amount}
                    currency={selectedDebt.currency}
                />
            )}
        </>
    )
}
