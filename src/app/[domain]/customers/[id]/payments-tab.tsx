'use client'

import { useState, useEffect, useActionState } from 'react'
import { createPayment } from '@/app/actions/payments'
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

interface PaymentsTabProps {
    customerId: string
    payments: any[]
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

export default function PaymentsTab({ customerId, payments }: PaymentsTabProps) {
    const [open, setOpen] = useState(false)
    const [state, formAction, isPending] = useActionState(createPayment, initialState)

    useEffect(() => {
        if (state.success && !state.error) {
            setOpen(false)
        }
    }, [state.success, state.error])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tahsilat Geçmişi</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Tahsilat Ekle</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Yeni Tahsilat</DialogTitle>
                            <DialogDescription>
                                Yapılan ödemeyi sisteme girin.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={formAction} className="grid gap-4 py-4">
                            <input type="hidden" name="customerId" value={customerId} />

                            {state.error && (
                                <div className="text-red-500 text-sm mb-2">{state.error}</div>
                            )}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="paymentMethod" className="text-right">
                                    Yöntem
                                </Label>
                                <Select name="paymentMethod" defaultValue="Havale/EFT" required>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Nakit">Nakit</SelectItem>
                                        <SelectItem value="Havale/EFT">Havale/EFT</SelectItem>
                                        <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                                        <SelectItem value="Çek">Çek</SelectItem>
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
                                <Label htmlFor="paymentDate" className="text-right">
                                    Tarih
                                </Label>
                                <Input id="paymentDate" name="paymentDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="col-span-3" required />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="reference" className="text-right">
                                    Ref/Kod
                                </Label>
                                <Input id="reference" name="reference" placeholder="Opsiyonel" className="col-span-3" />
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
                {payments?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Henüz tahsilat yapılmamış.</p>
                ) : (
                    <div className="space-y-1">
                        {payments?.map((payment: any) => (
                            <div key={payment.id} className="flex items-center justify-between border-b py-3 last:border-0">
                                <div className="flex flex-col gap-1">
                                    <div className="font-medium">{payment.payment_method}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString('tr-TR')}</div>
                                    {payment.reference && <div className="text-xs text-muted-foreground">Ref: {payment.reference}</div>}
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-green-600">+{Number(payment.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {payment.currency}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
