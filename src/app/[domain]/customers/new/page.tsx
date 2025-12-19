'use client'

import { useFormState } from 'react-dom'
import { createCustomer } from '@/app/actions/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const initialState = {
    error: '',
}

export default function NewCustomerPage() {
    const [state, formAction] = useFormState(createCustomer, initialState)

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-4">
                <Link href="/customers" className="text-sm text-muted-foreground hover:underline">
                    &larr; Geri
                </Link>
                <h1 className="text-lg font-bold md:text-2xl">Yeni Müşteri Ekle</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Müşteri Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Müşteri Ünvanı</Label>
                            <Input id="name" name="name" required placeholder="Örn: ABC Lojistik A.Ş." />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input id="phone" name="phone" placeholder="05XX..." />
                        </div>

                        {state?.error && (
                            <p className="text-red-500 text-sm">{state.error}</p>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button variant="outline" asChild>
                                <Link href="/customers">İptal</Link>
                            </Button>
                            <Button type="submit">
                                Kaydet
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
