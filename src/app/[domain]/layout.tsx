import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DemoSwitcher from '@/components/demo-switcher'
import { createClient } from '@/lib/supabase/server'

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const isDemo = domain.startsWith('demo') // demo.getcollectify.com or demo.localhost

    // Get current user role for demo switcher active state
    let currentRole = 'admin' // default
    if (isDemo) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            if (user.email?.includes('admin')) currentRole = 'admin'
            else if (user.email?.includes('accounting')) currentRole = 'accounting'
            else if (user.email?.includes('manager')) currentRole = 'manager'
            else if (user.email?.includes('seller')) currentRole = 'seller'
        }
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full border-r bg-muted/40 md:w-64 md:min-h-screen">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href={`/`} className="flex items-center gap-2 font-semibold">
                        <span className="">Collectify</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4 gap-2">
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/customers"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            Müşteriler
                        </Link>
                        <Link
                            href="/calendar"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            Takvim
                        </Link>
                        <Link
                            href="/import"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            İçe Aktar
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            Ayarlar
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <div className="w-full flex-1">
                        <h1 className="font-semibold text-lg">{domain}</h1>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <span className="sr-only">Toggle user menu</span>
                        <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                    </Button>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 relative">
                    {children}
                </main>
            </div>

            {/* Demo Switcher Widget */}
            {isDemo && <DemoSwitcher currentRole={currentRole} />}
        </div>
    )
}
