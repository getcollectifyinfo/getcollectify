'use client'

import { useState, useEffect, useActionState } from 'react'
import { createPromise } from '@/app/actions/promises'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PromisesTabProps {
    customerId: string
    promises: any[]
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

export default function PromisesTab({ customerId, promises }: PromisesTabProps) {
    const [open, setOpen] = useState(false)
    const [state, formAction, isPending] = useActionState(createPromise, initialState)

    useEffect(() => {
        if (state.success && !state.error) {
            setOpen(false)
        }
    }, [state.success, state.error])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ödeme Sözleri</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Söz Ekle</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Ödeme Sözü Ekle</DialogTitle>
                            <DialogDescription>
                                Müşterinin ödeme sözünü kaydedin.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={formAction} className="grid gap-4 py-4">
                            <input type="hidden" name="customerId" value={customerId} />

                            {state.error && (
                                <div className="text-red-500 text-sm mb-2">{state.error}</div>
                            )}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="promiseDate" className="text-right">
                                    Tarih
                                </Label>
                                <Input id="promiseDate" name="promiseDate" type="date" className="col-span-3" required />
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

                            <div className="grid gap-2">
                                <Textarea id="note" name="note" placeholder="Not (Opsiyonel)" />
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
                {promises?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aktif ödeme sözü bulunmuyor.</p>
                ) : (
                    <div className="space-y-4">
                        {promises?.map((promise: any) => (
                            <div key={promise.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <CalendarClock className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{new Date(promise.promise_date).toLocaleDateString('tr-TR')}</div>
                                        {promise.note && <div className="text-xs text-muted-foreground">{promise.note}</div>}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <div className="font-bold">{Number(promise.amount).toLocaleString('tr-TR')} {promise.currency}</div>
                                    <Badge variant={promise.status === 'pending' ? 'secondary' : promise.status === 'kept' ? 'default' : 'destructive'} className='text-[10px] px-2 py-0 h-5'>
                                        {promise.status === 'pending' ? 'Bekliyor' : promise.status === 'kept' ? 'Tuttu' : 'Tutmadı'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
