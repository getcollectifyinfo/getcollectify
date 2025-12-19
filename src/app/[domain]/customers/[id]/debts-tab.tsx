'use client'

import { useState, useEffect, useActionState } from 'react'
import { createDebt } from '@/app/actions/debts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from 'lucide-react'

// Props for the client component
interface DebtsTabProps {
    customerId: string
    debts: any[]
}

interface ActionState {
    message: string
    error: string
    success: boolean
}

const initialState: ActionState = {
    message: '',
    error: '',
    success: false
}

export default function DebtsTab({ customerId, debts }: DebtsTabProps) {
    const [open, setOpen] = useState(false)
    const [state, formAction, isPending] = useActionState(createDebt, initialState)

    useEffect(() => {
        if (state.success && !state.error) {
            setOpen(false)
        }
    }, [state.success, state.error])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Borç Listesi</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Borç Ekle</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Yeni Borç Ekle</DialogTitle>
                            <DialogDescription>
                                Fatura, çek veya senet girişi yapın.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={formAction} className="grid gap-4 py-4">
                            <input type="hidden" name="customerId" value={customerId} />

                            {state.error && (
                                <div className="text-red-500 text-sm mb-2">{state.error}</div>
                            )}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="debtType" className="text-right">
                                    Tip
                                </Label>
                                <Select name="debtType" defaultValue="Cari" required>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cari">Cari Hesap (Fatura)</SelectItem>
                                        <SelectItem value="Çek">Çek</SelectItem>
                                        <SelectItem value="Senet">Senet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">
                                    Tutar
                                </Label>
                                <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="currency" className="text-right">
                                    Döviz
                                </Label>
                                <Select name="currency" defaultValue="TRY" required>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TRY">TRY (₺)</SelectItem>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dueDate" className="text-right">
                                    Vade
                                </Label>
                                <Input id="dueDate" name="dueDate" type="date" className="col-span-3" required />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {debts?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Kayıtlı borç bulunmuyor.</p>
                ) : (
                    <div className="space-y-1">
                        {debts?.map((debt: any) => (
                            <div key={debt.id} className="flex items-center justify-between border-b py-3 last:border-0">
                                <div className="flex flex-col gap-1">
                                    <div className="font-medium">{debt.debt_type}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(debt.due_date).toLocaleDateString('tr-TR')} Vadeli</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{Number(debt.remaining_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {debt.currency}</div>
                                    <div className="text-xs text-muted-foreground">Toplam: {Number(debt.original_amount).toLocaleString('tr-TR')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
