'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = {
    error: '',
}

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Giriş Yap</CardTitle>
                <CardDescription>
                    Hesabınıza giriş yapın
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Şifre</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    {state?.error && (
                        <p className="text-red-500 text-sm">{state.error}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}