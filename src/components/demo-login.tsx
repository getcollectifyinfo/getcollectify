'use client'

import { useState } from 'react'
import { loginAsDemoUser } from '@/app/actions/demo-login'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, User, Briefcase, Calculator, ShoppingBag, ArrowLeft } from 'lucide-react'
import { cn, getSiteUrl } from '@/lib/utils'
import Link from 'next/link'

const ROLES = [
    {
        id: 'seller',
        title: 'Satış Temsilcisi',
        icon: ShoppingBag,
        email: 'demo-seller@collectify.com',
        description: 'Müşteri ve satış yönetimi'
    },
    {
        id: 'manager',
        title: 'Müdür',
        icon: Briefcase,
        email: 'demo-manager@collectify.com',
        description: 'Ekip ve raporlama'
    },
    {
        id: 'accounting',
        title: 'Muhasebe',
        icon: Calculator,
        email: 'demo-accounting@collectify.com',
        description: 'Finansal işlemler'
    },
    {
        id: 'admin',
        title: 'Yönetici',
        icon: User,
        email: 'demo-admin@collectify.com',
        description: 'Tam yetkili erişim'
    }
] as const

export default function DemoLogin() {
    const [selectedRole, setSelectedRole] = useState<typeof ROLES[number]['id']>('seller')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const currentRole = ROLES.find(r => r.id === selectedRole)!

    const handleLogin = async () => {
        setIsLoading(true)
        setError('')
        try {
            const result = await loginAsDemoUser(selectedRole)
            if (!result.success) {
                setError(result.error || 'Giriş yapılamadı')
            }
        } catch (e) {
            setError('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-4xl grid gap-8 md:grid-cols-2 relative">
            <div className="absolute -top-16 left-0">
                <Link 
                    href={getSiteUrl()} 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Ana Sayfaya Dön
                </Link>
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Rol Seçiniz</h2>
                    <p className="text-muted-foreground">
                        Demoyu deneyimlemek için bir kullanıcı rolü seçin.
                    </p>
                </div>
                
                <div className="grid gap-4">
                    {ROLES.map((role) => {
                        const Icon = role.icon
                        const isSelected = selectedRole === role.id
                        return (
                            <div
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={cn(
                                    "relative flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all hover:bg-accent",
                                    isSelected ? "border-primary bg-accent ring-1 ring-primary" : "bg-card"
                                )}
                            >
                                <div className={cn("rounded-full p-2", isSelected ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{role.title}</h3>
                                    <p className="text-sm text-muted-foreground">{role.description}</p>
                                </div>
                                {isSelected && (
                                    <div className="absolute right-4 top-4">
                                        <Check className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex items-center justify-center">
                <Card className="w-full max-w-sm border-2">
                    <CardHeader>
                        <CardTitle>Giriş Yap</CardTitle>
                        <CardDescription>
                            Seçili rol ile otomatik giriş yapın
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input value={currentRole.email} readOnly className="bg-muted" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Şifre</Label>
                            <Input type="password" value="demo1234" readOnly className="bg-muted" />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 font-medium">{error}</p>
                        )}

                        <Button onClick={handleLogin} disabled={isLoading} className="w-full" size="lg">
                            {isLoading ? 'Giriş Yapılıyor...' : `${currentRole.title} Olarak Giriş Yap`}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}