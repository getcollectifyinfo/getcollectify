'use client'

import { useActionState } from 'react'
import { updateCompanySettings } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const initialState = {
    message: '',
    error: '',
    success: false
}

interface CompanyInfo {
    id: string
    name: string
    base_currency: string
    timezone: string
    logo_url?: string | null
}

export default function GeneralSettingsTab({ company }: { company: CompanyInfo }) {
    const [state, formAction, isPending] = useActionState(updateCompanySettings, initialState)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Firma Bilgileri</CardTitle>
                <CardDescription>Firmanızın genel ayarlarını buradan yönetebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    {state.error && <p className="text-sm text-red-500">{state.error}</p>}
                    {state.success && <p className="text-sm text-green-500">{state.message}</p>}

                    <div className="grid gap-2">
                        <Label htmlFor="name">Firma Adı</Label>
                        <Input id="name" name="name" defaultValue={company.name} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="baseCurrency">Ana Para Birimi</Label>
                            <Select name="baseCurrency" defaultValue={company.base_currency}>
                                <SelectTrigger>
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
                            <Label htmlFor="timezone">Zaman Dilimi</Label>
                            <Select name="timezone" defaultValue={company.timezone}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Europe/Istanbul">Europe/Istanbul</SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="logoUrl">Logo URL</Label>
                        <Input id="logoUrl" name="logoUrl" defaultValue={company.logo_url || ''} placeholder="https://..." />
                    </div>

                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
