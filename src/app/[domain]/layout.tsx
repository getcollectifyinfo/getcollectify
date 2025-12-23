import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DemoSwitcher from '@/components/demo-switcher'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const isDemo = domain.startsWith('demo') // demo.getcollectify.com or demo.localhost

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const headersList = await headers()
    const pathname = headersList.get('x-url') || ''

    console.log('Layout Debug:', {
        domain,
        pathname,
        isDemo,
        hasUser: !!user
    })

    // If Demo environment and NOT logged in, redirect to login page
    // Avoid redirect loop if already on login page
    if (isDemo && !user && !pathname.endsWith('/login')) {
        console.log('Layout Redirect Debug:', { isDemo, hasUser: !!user, pathname })
        redirect('/login')
    }

    // Get current user role for demo switcher active state
    let currentRole = 'admin' // default
    if (isDemo && user) {
        try {
            // Use Admin Client to fetch profile safely (bypass RLS recursion)
            // Check if Service Key is available
            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                console.warn('SUPABASE_SERVICE_ROLE_KEY is missing, skipping profile fetch')
                throw new Error('Missing Service Role Key')
            }

            const adminSupabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            )
            const { data: profile, error: profileError } = await adminSupabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profileError) {
                console.error('Error fetching profile:', profileError)
                throw profileError
            }

            if (profile) {
                if (profile.role === 'company_admin') currentRole = 'admin'
                else if (profile.role === 'manager' && user.email === 'demo-manager-2@collectify.com') currentRole = 'manager2'
                else if (profile.role === 'seller' && user.email === 'demo-seller-2@collectify.com') currentRole = 'seller2'
                else currentRole = profile.role
            } 
        } catch (error) {
            console.error('Layout Profile Fetch Error:', error)
             // Fallback to email check if profile fails
            if (user.email?.includes('admin')) currentRole = 'admin'
            else if (user.email?.includes('accounting')) currentRole = 'accounting'
            else if (user.email?.includes('manager-2')) currentRole = 'manager2'
            else if (user.email?.includes('manager')) currentRole = 'manager'
            else if (user.email?.includes('seller-2')) currentRole = 'seller2'
            else if (user.email?.includes('seller')) currentRole = 'seller'
        }
    }

    // Special handling for Login Page: Render without Sidebar
    if (pathname.endsWith('/login')) {
        return <div className="min-h-screen bg-background">{children}</div>
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full border-r bg-muted/40 md:w-64 md:min-h-screen flex flex-col">
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
                            href="/receivables"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            Alacaklar
                        </Link>
                        <Link
                            href="/customers"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            Müşteriler
                        </Link>
                        <Link
                            href="/users"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            Kullanıcılar
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
                <div className="p-4 border-t">
                    <form action={logout}>
                        <Button variant="outline" className="w-full gap-2 justify-start" type="submit">
                            <LogOut className="h-4 w-4" />
                            Çıkış Yap
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <div className="w-full flex-1">
                        <h1 className="font-semibold text-lg">{domain}</h1>
                    </div>
                    
                    {user && (
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-xs font-medium">{user.email}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{user.id}</span>
                        </div>
                    )}

                    <Button variant="ghost" size="icon" className="rounded-full">
                        <span className="sr-only">Toggle user menu</span>
                        <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                    </Button>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 relative">
                    {children}
                </main>
            </div>

            {/* Demo Switcher Widget - Only show if logged in, to switch roles easily */}
            {isDemo && user && <DemoSwitcher key={currentRole} currentRole={currentRole} />}
        </div>
    )
}
