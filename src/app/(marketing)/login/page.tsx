'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function GlobalLoginPage() {
    const [slug, setSlug] = useState('')
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug) return

        // Redirect to tenant domain
        const protocol = window.location.protocol
        const rootDomain = window.location.host.includes('localhost')
            ? 'localhost:3000'
            : 'getcollectify.com' // Should ideally come from env public var

        const tenantUrl = `${protocol}//${slug}.${rootDomain}/login`
        window.location.href = tenantUrl
    }

    return (
        <div className="flex min-h-screen items-center justify-center py-12">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Giriş Yap</CardTitle>
                    <CardDescription>
                        Şirketinizin çalışma alanına gidin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Şirket Adı (Slug)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    required
                                    placeholder="acme"
                                    className="text-right"
                                />
                                <span className="text-muted-foreground">.getcollectify.com</span>
                            </div>
                        </div>
                        <Button type="submit" className="w-full">
                            Devam Et
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
