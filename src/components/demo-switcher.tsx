'use client'

import { useState, startTransition, type ElementType, type SVGProps, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Users, UserCog, UserCheck, Shield, ChevronUp, ChevronDown, Check } from 'lucide-react'
import { loginAsDemoUser } from '@/app/actions/demo-login'
import { useRouter, usePathname } from 'next/navigation'

type Role = 'admin' | 'accounting' | 'manager' | 'manager2' | 'seller' | 'seller2'

const roles: { id: Role, name: string, icon: ElementType, desc: string }[] = [
    { id: 'admin', name: 'Yönetici (Admin)', icon: Shield, desc: 'Tam Yetki' },
    { id: 'accounting', name: 'Muhasebe', icon: DollarSignIcon, desc: 'Tahsilat & Borç' },
    { id: 'manager', name: 'Satış Yöneticisi-01', icon: UserCog, desc: 'Ekip Performansı' },
    { id: 'manager2', name: 'Satış Yöneticisi-02', icon: UserCog, desc: 'Ekip Performansı' },
    { id: 'seller', name: 'Satış Temsilcisi-01', icon: UserCheck, desc: 'Sadece Kendi Müşterileri' },
    { id: 'seller2', name: 'Satış Temsilcisi-02', icon: UserCheck, desc: 'Sadece Kendi Müşterileri' },
]

function DollarSignIcon(props: SVGProps<SVGSVGElement>) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="1" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
}

export default function DemoSwitcher({ currentRole }: { currentRole?: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'logging_out' | 'logging_in'>('idle')
    const [targetRoleName, setTargetRoleName] = useState<string>('')
    const router = useRouter()
    const pathname = usePathname()

    function switchRole(role: Role) {
        if (role === currentRole) return

        const selectedRoleName = roles.find(r => r.id === role)?.name || role
        setTargetRoleName(selectedRoleName)
        
        // Start logout sequence
        setStatus('logging_out')
        setIsOpen(false) // Close the menu so we can see the button status clearly

        // Simulate logout delay for UX
        setTimeout(() => {
            setStatus('logging_in')
            
            startTransition(async () => {
                const result = await loginAsDemoUser(role, pathname || '/')
                if (result.success) {
                    // Success handling is done via redirect in the action
                    // But if we are here, something might have happened or we rely on router.refresh
                    router.refresh()
                } else {
                    // Reset on error
                    setStatus('idle')
                }
            })
        }, 1500)
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {isOpen && status === 'idle' && (
                <Card className="mb-2 w-72 p-2 shadow-2xl border-blue-200 bg-white/95 backdrop-blur animate-in slide-in-from-bottom-5">
                    <div className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Rol Değiştir (Demo)
                    </div>
                    <div className="space-y-1">
                        {roles.map((r) => (
                            <button
                                key={r.id}
                                disabled={status !== 'idle'}
                                onClick={() => switchRole(r.id)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-100 ${currentRole === r.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                            >
                                <r.icon className="h-4 w-4 opacity-70" />
                                <div className="flex-1 text-left">
                                    <div>{r.name}</div>
                                    <div className="text-[10px] text-slate-400">{r.desc}</div>
                                </div>
                                {currentRole === r.id && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            <Button
                size="lg"
                onClick={() => setIsOpen(!isOpen)}
                disabled={status !== 'idle'}
                className="rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white gap-2 pr-6 h-12"
            >
                {status === 'idle' && (
                    <>
                        <div className="bg-blue-500 h-2 w-2 rounded-full animate-pulse"></div>
                        Rol Değiştir
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </>
                )}
                {status === 'logging_out' && (
                    <>
                        <div className="bg-red-500 h-2 w-2 rounded-full animate-pulse"></div>
                        Çıkış yapılıyor...
                    </>
                )}
                {status === 'logging_in' && (
                    <>
                        <div className="bg-green-500 h-2 w-2 rounded-full animate-pulse"></div>
                        {targetRoleName} olarak giriş yapılıyor...
                    </>
                )}
            </Button>
        </div>
    )
}
