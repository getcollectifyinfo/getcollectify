'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { updateCompanySettings } from '@/app/actions/update-company-settings'
import { toast } from 'sonner'

interface ConfigTabProps {
    company: any
}

export default function ConfigTab({ company }: ConfigTabProps) {
    const [debtTypes, setDebtTypes] = useState<string[]>(company?.debt_types || ['Cari', 'Çek', 'Senet'])
    const [currencies, setCurrencies] = useState<string[]>(company?.currencies || ['TRY', 'USD', 'EUR'])
    const [newDebtType, setNewDebtType] = useState('')
    const [newCurrency, setNewCurrency] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    async function handleAddDebtType() {
        if (!newDebtType.trim()) return
        if (debtTypes.includes(newDebtType.trim())) {
            toast.error('Bu borç tipi zaten mevcut')
            return
        }
        const updated = [...debtTypes, newDebtType.trim()]
        setDebtTypes(updated)
        setNewDebtType('')
        await saveSettings({ debtTypes: updated })
    }

    async function handleRemoveDebtType(type: string) {
        const updated = debtTypes.filter(t => t !== type)
        setDebtTypes(updated)
        await saveSettings({ debtTypes: updated })
    }

    async function handleAddCurrency() {
        if (!newCurrency.trim()) return
        if (currencies.includes(newCurrency.trim().toUpperCase())) {
            toast.error('Bu para birimi zaten mevcut')
            return
        }
        const updated = [...currencies, newCurrency.trim().toUpperCase()]
        setCurrencies(updated)
        setNewCurrency('')
        await saveSettings({ currencies: updated })
    }

    async function handleRemoveCurrency(currency: string) {
        const updated = currencies.filter(c => c !== currency)
        setCurrencies(updated)
        await saveSettings({ currencies: updated })
    }

    async function saveSettings(updates: { debtTypes?: string[], currencies?: string[] }) {
        setIsSaving(true)
        const result = await updateCompanySettings(company.id, updates)
        setIsSaving(false)

        if (result.success) {
            toast.success('Ayarlar kaydedildi')
        } else {
            toast.error(result.error || 'Kaydetme hatası')
        }
    }

    return (
        <div className="space-y-6">
            {/* Debt Types */}
            <Card>
                <CardHeader>
                    <CardTitle>Borç Tipleri</CardTitle>
                    <CardDescription>
                        Alacak girişinde kullanılacak borç tiplerini yönetin
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {debtTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="text-sm px-3 py-1">
                                {type}
                                <button
                                    onClick={() => handleRemoveDebtType(type)}
                                    className="ml-2 hover:text-destructive"
                                    disabled={isSaving}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Yeni borç tipi (örn: Havale)"
                            value={newDebtType}
                            onChange={(e) => setNewDebtType(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddDebtType()}
                            disabled={isSaving}
                        />
                        <Button onClick={handleAddDebtType} disabled={isSaving}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ekle
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Currencies */}
            <Card>
                <CardHeader>
                    <CardTitle>Para Birimleri</CardTitle>
                    <CardDescription>
                        Alacak girişinde kullanılacak para birimlerini yönetin
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {currencies.map((currency) => (
                            <Badge key={currency} variant="secondary" className="text-sm px-3 py-1">
                                {currency}
                                <button
                                    onClick={() => handleRemoveCurrency(currency)}
                                    className="ml-2 hover:text-destructive"
                                    disabled={isSaving}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Yeni para birimi (örn: GBP)"
                            value={newCurrency}
                            onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCurrency()}
                            disabled={isSaving}
                            maxLength={3}
                        />
                        <Button onClick={handleAddCurrency} disabled={isSaving}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ekle
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
