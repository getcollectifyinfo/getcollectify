'use client'

import { useFormState } from 'react-dom'
import { signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const initialState = {
    error: '',
}

export default function SignupPage() {
    const [state, formAction] = useFormState(signup, initialState)

    return (
        <div className="flex min-h-screen items-center justify-center py-12">
            <Card className="mx-auto max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Ücretsiz Deneyin</CardTitle>
                    <CardDescription>
                        30 gün ücretsiz. Kredi kartı gerekmez.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="companyName">Şirket Adı</Label>
                            <Input id="companyName" name="companyName" required placeholder="Acme Ltd." />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Alt Alan Adı (Slug)</Label>
                            <div className="flex items-center gap-2">
                                <Input id="slug" name="slug" required placeholder="acme" className="text-right" />
                                <span className="text-muted-foreground">.getcollectify.com</span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required placeholder="admin@acme.com" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>

                        {state?.error && (
                            <p className="text-red-500 text-sm">{state.error}</p>
                        )}

                        <Button type="submit" className="w-full">
                            Hesap Oluştur
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Zaten hesabınız var mı?{' '}
                        <Link href="/login" className="underline">
                            Giriş Yap
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
