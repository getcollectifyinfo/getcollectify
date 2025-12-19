'use client'

import { useState, useActionState } from 'react'
import { addFxRate } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const initialState = {
    message: '',
    error: '',
    success: false
}

export default function FxRatesTab({ fxRates }: { fxRates: any[] }) {
    const [state, formAction, isPending] = useActionState(addFxRate, initialState)

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Yeni Kur Ekle</CardTitle>
                    <CardDescription>Manuel kur girişi yapın.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {state.error && <p className="text-sm text-red-500">{state.error}</p>}
                        {state.success && <p className="text-sm text-green-500">{state.message}</p>}

                        <div className="grid gap-2">
                            <Label htmlFor="date">Tarih</Label>
                            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="baseCurrency">Baz Döviz</Label>
                                <Select name="baseCurrency" defaultValue="USD">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quoteCurrency">Hedef Döviz</Label>
                                <Select name="quoteCurrency" defaultValue="TRY">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TRY">TRY</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="rate">Kur Değeri</Label>
                            <Input id="rate" name="rate" type="number" step="0.0001" placeholder="34.50" required />
                        </div>

                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Ekleniyor...' : 'Ekle'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Geçmiş Kurlar</CardTitle>
                </CardHeader>
                <CardContent>
                    {fxRates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Kayıtlı kur bulunmuyor.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Parite</TableHead>
                                    <TableHead className="text-right">Değer</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fxRates.map((rate) => (
                                    <TableRow key={rate.id}>
                                        <TableCell>{new Date(rate.date).toLocaleDateString('tr-TR')}</TableCell>
                                        <TableCell>{rate.base_currency}/{rate.quote_currency}</TableCell>
                                        <TableCell className="text-right font-medium">{Number(rate.rate).toFixed(4)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
