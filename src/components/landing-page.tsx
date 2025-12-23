'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, DollarSign, Users, BarChart3, ShieldCheck, ArrowRight, Menu, X, Calendar, FileText } from 'lucide-react'
import { useState } from 'react'
import { getSiteUrl } from '@/lib/utils'

type Lang = 'en' | 'tr'

interface Content {
    nav: { features: string, pricing: string, login: string, start: string }
    hero: { headline: string, subheadline: string, start: string, demo: string }
    problem: { title: string, items: string[] }
    solution: { title: string, items: { title: string, desc: string }[] }
    features: { items: string[] }
    how: { title: string, steps: string[] }
    demo: { title: string, button: string }
    cta: { text: string, button: string }
    footer: { desc: string }
}

const content: Record<Lang, Content> = {
    en: {
        nav: { features: 'Features', pricing: 'Pricing', login: 'Login', start: 'Try Live Demo' },
        hero: {
            headline: 'Turn Your Sales Team Into a Collection Engine',
            subheadline: 'Collectify helps sales, finance, and management work together to accelerate cash flow — without conflict.',
            start: 'Try Live Demo',
            demo: 'How it works'
        },
        problem: {
            title: 'Why collections slow down',
            items: [
                'Sales closes the deal and moves on',
                'Accounting chases payments without customer context',
                'Customers delay payments internally',
                'No shared visibility between teams',
                'No clear ownership of the debt'
            ]
        },
        solution: {
            title: 'Sales-led collections, finally aligned',
            items: [
                { title: 'Sales Ownership', desc: 'Sales reps follow their own customers, preventing relationship damage.' },
                { title: 'Unified Timeline', desc: 'Accounting and Sales see the same notes, promises, and payment history.' },
                { title: 'Zero Conflict', desc: 'Managers oversee the process, ensuring no customer is left behind.' }
            ]
        },
        features: {
            items: [
                'Multi-role access (Sales, Manager, Accounting)',
                'Customer-based debt tracking',
                'Notes & payment promises (CRM)',
                'Weekly and monthly collection calendar',
                'Partial payments & balance tracking',
                'Multi-currency support (USD, EUR, TRY)',
                'CSV import from Excel',
                'Mobile-first design'
            ]
        },
        how: {
            title: 'How It Works',
            steps: [
                '1. Upload your receivables (CSV / Excel)',
                '2. Sales & finance collaborate on follow-ups',
                '3. Get paid faster'
            ]
        },
        demo: { title: 'See it in action', button: 'Open Live Demo' },
        cta: { text: 'Cash flow is a team sport.', button: 'Try Live Demo' },
        footer: { desc: 'The modern operating system for B2B collections.' }
    },
    tr: {
        nav: { features: 'Özellikler', pricing: 'Fiyatlandırma', login: 'Giriş', start: 'Canlı Demo' },
        hero: {
            headline: 'Satış Ekibinizi Tahsilat Motoruna Dönüştürün',
            subheadline: 'Collectify, satış, muhasebe ve yöneticileri tek bir tahsilat sürecinde buluşturur, nakit akışını hızlandırır.',
            start: 'Canlı Demo',
            demo: 'Nasıl Çalışır?'
        },
        problem: {
            title: 'Tahsilatlar neden gecikir?',
            items: [
                'Satış ekibi satışı yapar ve kenara çekilir',
                'Muhasebe, müşteri ilişkisini bilmeden arama yapar',
                'Müşteriler ödemeyi içeride bekletir',
                'Ekipler arası görünürlük yoktur',
                'Borcun sahibi belirsizdir'
            ]
        },
        solution: {
            title: 'Satış odaklı tahsilat yönetimi',
            items: [
                { title: 'Satış Sahipliği', desc: 'Satışçılar kendi müşterilerini takip eder, ilişkiyi korur.' },
                { title: 'Ortak Zaman Çizelgesi', desc: 'Muhasebe ve Satış aynı notları, sözleri ve ödemeleri görür.' },
                { title: 'Sıfır Çatışma', desc: 'Yöneticiler süreci izler, hiçbir müşterinin ihmal edilmediğinden emin olur.' }
            ]
        },
        features: {
            items: [
                'Çoklu rol yapısı (Satış, Yönetici, Muhasebe)',
                'Müşteri bazlı borç takibi',
                'Notlar ve ödeme sözleri (CRM)',
                'Haftalık ve aylık tahsilat takvimi',
                'Parçalı ödeme ve bakiye takibi',
                'Çoklu döviz desteği (USD, EUR, TRY)',
                'Excel/CSV ile içe aktarım',
                'Mobil uyumlu tasarım'
            ]
        },
        how: {
            title: 'Nasıl Çalışır?',
            steps: [
                '1. Alacaklarınızı yükleyin (CSV / Excel)',
                '2. Satış ve finans birlikte takip etsin',
                '3. Ödemelerinizi hızlandırın'
            ]
        },
        demo: { title: 'Canlı Görün', button: 'Canlı Demo\'yu Aç' },
        cta: { text: 'Nakit akışı bir takım sporudur.', button: 'Canlı Demo\'yu Dene' },
        footer: { desc: 'B2B tahsilatları için modern işletim sistemi.' }
    }
}

export default function LandingPage({ lang = 'en' }: { lang?: Lang }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const t = content[lang]

    // Use centralized URL helper to ensure consistency between Server Actions and Client Components
    const demoUrl = getSiteUrl('demo')

    return (
        <div className="flex min-h-screen flex-col font-sans text-slate-900 bg-white">
            {/* Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-900">
                        <ShieldCheck className="h-6 w-6 text-blue-600" />
                        <span>Collectify</span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex gap-6 items-center text-sm font-medium text-slate-600">
                        <Link href="#features" className="hover:text-blue-600 transition">{t.nav.features}</Link>
                        <Link href="#pricing" className="hover:text-blue-600 transition">{t.nav.pricing}</Link>
                        <Link href={lang === 'tr' ? '/' : '/tr'} className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">
                            {lang === 'tr' ? 'EN' : 'TR'}
                        </Link>
                    </nav>

                    <div className="hidden md:flex gap-4 items-center">
                        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600">{t.nav.login}</Link>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6" asChild>
                            <Link href={demoUrl}>
                                {t.nav.start}
                            </Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="md:hidden border-b bg-white p-4 space-y-4 flex flex-col items-center">
                    <Link href="#features" onClick={() => setMobileMenuOpen(false)}>{t.nav.features}</Link>
                    <Link href="#pricing" onClick={() => setMobileMenuOpen(false)}>{t.nav.pricing}</Link>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>{t.nav.login}</Link>
                    <Link href={lang === 'tr' ? '/' : '/tr'}>{lang === 'tr' ? 'Switch to English' : 'Türkçe\'ye Geç'}</Link>
                </div>
            )}

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 md:py-32 overflow-hidden px-4 md:px-6">
                    <div className="container mx-auto flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                                {t.hero.headline}
                            </h1>
                            <p className="text-xl text-slate-500 max-w-[600px] mx-auto lg:mx-0 leading-relaxed">
                                {t.hero.subheadline}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all" asChild>
                                    <Link href={demoUrl}>
                                        {t.hero.start}
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-2" asChild>
                                    <Link href="#how">
                                        {t.hero.demo}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 w-full max-w-[600px] lg:max-w-none">
                            <div className="relative rounded-2xl border bg-slate-50 shadow-2xl p-4 md:p-8 aspect-[4/3] flex flex-col gap-4 overflow-hidden">
                                {/* Simplified Dashboard Mockup */}
                                <div className="flex gap-4 mb-4">
                                    <div className="h-24 w-1/3 bg-white rounded-xl shadow-sm border p-4">
                                        <div className="h-2 w-12 bg-slate-200 rounded mb-2"></div>
                                        <div className="h-6 w-20 bg-blue-100 rounded"></div>
                                    </div>
                                    <div className="h-24 w-1/3 bg-white rounded-xl shadow-sm border p-4">
                                        <div className="h-2 w-12 bg-slate-200 rounded mb-2"></div>
                                        <div className="h-6 w-20 bg-green-100 rounded"></div>
                                    </div>
                                    <div className="h-24 w-1/3 bg-white rounded-xl shadow-sm border p-4">
                                        <div className="h-2 w-12 bg-slate-200 rounded mb-2"></div>
                                        <div className="h-6 w-20 bg-orange-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 space-y-4">
                                    <div className="flex justify-between border-b pb-2">
                                        <div className="h-4 w-32 bg-slate-100 rounded"></div>
                                        <div className="h-4 w-16 bg-slate-100 rounded"></div>
                                    </div>
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4].map(placeholder => (
                                            <div key={placeholder} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100"></div>
                                                    <div className="space-y-1">
                                                        <div className="h-3 w-24 bg-slate-100 rounded"></div>
                                                        <div className="h-2 w-16 bg-slate-50 rounded"></div>
                                                    </div>
                                                </div>
                                                <div className="h-6 w-16 bg-slate-50 rounded-full"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Problem Section */}
                <section className="py-20 bg-slate-50 px-4">
                    <div className="container mx-auto text-center max-w-4xl">
                        <h2 className="text-3xl font-bold mb-12">{t.problem.title}</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {t.problem.items.map((item, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border flex items-start gap-4 text-left">
                                    <div className="h-2 w-2 rounded-full bg-red-400 mt-2 shrink-0" />
                                    <p className="text-slate-600">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Solution Section */}
                <section className="py-20 px-4">
                    <div className="container mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold">{t.solution.title}</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {t.solution.items.map((item, i) => (
                                <Card key={i} className="border-none shadow-lg bg-linear-to-br from-white to-slate-50">
                                    <CardHeader>
                                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                                            {i === 0 ? <Users /> : i === 1 ? <BarChart3 /> : <ShieldCheck />}
                                        </div>
                                        <CardTitle className="text-xl">{item.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-600 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features & Dashboard Preview */}
                <section id="features" className="py-20 bg-slate-900 text-white px-4">
                    <div className="container mx-auto">
                        <div className="flex flex-col lg:flex-row gap-16 items-center">
                            <div className="flex-1 space-y-8">
                                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                                    Everything you need to <span className="text-blue-400">collect faster</span>.
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {t.features.items.map((feat, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <CheckCircle2 className="text-blue-400 h-5 w-5 shrink-0" />
                                            <span className="text-slate-300 font-medium">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-800 p-1">
                                    {/* Abstract representation of Calendar/List */}
                                    <div className="bg-slate-900 rounded-lg p-6 space-y-4">
                                        <div className="flex justify-between items-center text-slate-400 text-sm">
                                            <span>January 2026</span>
                                            <div className="flex gap-2">
                                                <div className="h-8 w-8 rounded bg-slate-800"></div>
                                                <div className="h-8 w-8 rounded bg-slate-800"></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-2 text-center text-slate-600 text-xs mb-2">
                                            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                                        </div>
                                        <div className="grid grid-cols-7 gap-2">
                                            {[...Array(28)].map((_, i) => (
                                                <div key={i} className={`h-10 rounded-md border border-slate-700/50 flex items-center justify-center text-xs text-slate-500 relative ${i === 12 || i === 18 ? 'bg-blue-900/20 border-blue-500/50 text-blue-200' : 'bg-slate-800/50'}`}>
                                                    {i + 1}
                                                    {(i === 12 || i === 18) && <div className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-400"></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section id="how" className="py-20 px-4">
                    <div className="container mx-auto max-w-4xl text-center">
                        <h2 className="text-3xl font-bold mb-12">{t.how.title}</h2>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
                            {/* Line connector */}
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 hidden md:block"></div>

                            {t.how.steps.map((step, i) => (
                                <div key={i} className="flex flex-col items-center gap-4 bg-white p-4">
                                    <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                                        {i + 1}
                                    </div>
                                    <h3 className="font-semibold text-lg">{step}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Call To Action */}
                <section className="py-24 bg-blue-600 text-white text-center px-4">
                    <div className="container mx-auto space-y-8">
                        <h2 className="text-4xl font-extrabold tracking-tight">
                            {t.cta.text}
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" variant="secondary" className="text-blue-900 font-bold text-lg px-10 py-6 rounded-full" asChild>
                                <Link href="https://demo.getcollectify.com">
                                    {t.cta.button}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t py-12 bg-slate-50">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <ShieldCheck className="h-6 w-6" />
                        <span>Collectify</span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © 2025 Collectify. {t.footer.desc}
                    </p>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <Link href="#" className="hover:text-blue-600">Privacy</Link>
                        <Link href="#" className="hover:text-blue-600">Terms</Link>
                        <Link href="#" className="hover:text-blue-600">Twitter</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
