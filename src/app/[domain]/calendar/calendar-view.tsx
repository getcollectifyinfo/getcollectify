'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { format, startOfWeek, addWeeks, subWeeks, addDays, isSameDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react'

interface CalendarPromise {
    id: string
    promised_date: string
    amount: number
    currency: string
    status: string
    note?: string
    customers: {
        name: string
    } | null
    debts?: {
        due_date: string
        debt_type: string
    } | null
}

interface CalendarViewProps {
    promises: CalendarPromise[]
}

export function CalendarView({ promises }: CalendarViewProps) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

    // Group promises by date for generic lookup
    const promisesByDate = React.useMemo(() => {
        const map = new Map<string, CalendarPromise[]>()
        promises.forEach(p => {
            // Safe date parsing: use string directly if YYYY-MM-DD, otherwise split ISO
            const d = p.promised_date.includes('T') ? p.promised_date.split('T')[0] : p.promised_date
            if (!map.has(d)) map.set(d, [])
            map.get(d)?.push(p)
        })
        return map
    }, [promises])

    const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : ''
    const selectedPromises = promisesByDate.get(selectedDateStr) || []

    const nextWeek = () => setWeekStart(prev => addWeeks(prev, 1))
    const prevWeek = () => setWeekStart(prev => subWeeks(prev, 1))
    const resetWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

    const renderPromiseList = (list: CalendarPromise[]) => {
        if (list.length === 0) {
            return <p className="text-muted-foreground text-sm">Bu tarihte ödeme sözü bulunmuyor.</p>
        }
        return (
            <div className="space-y-4">
                {list.map((promise) => (
                    <div key={promise.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                            <div className="font-semibold">{promise.customers?.name}</div>
                            {promise.debts && (
                                <div className="text-xs text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                                    Borç Vadesi: {new Date(promise.debts.due_date).toLocaleDateString('tr-TR')}
                                    {promise.debts.debt_type && ` • ${promise.debts.debt_type}`}
                                </div>
                            )}
                            {promise.note && <div className="text-sm text-muted-foreground mt-1">{promise.note}</div>}
                        </div>
                        <div className="text-right">
                            <div className="font-bold">{Number(promise.amount).toLocaleString('tr-TR')} {promise.currency}</div>
                            <Badge 
                                variant={
                                    (promise.status === 'pending' || promise.status === 'planned') ? 'secondary' : 
                                    promise.status === 'kept' ? 'default' : 
                                    'destructive'
                                } 
                                className='text-[10px]'
                            >
                                {(promise.status === 'pending' || promise.status === 'planned') ? 'Bekliyor' : 
                                 promise.status === 'kept' ? 'Tuttu' : 
                                 'Tutmadı'}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Tabs defaultValue="month" className="w-full">
            <div className="flex items-center justify-between mb-6">
                <TabsList>
                    <TabsTrigger value="month" className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Aylık
                    </TabsTrigger>
                    <TabsTrigger value="week" className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        Haftalık
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="month" className="mt-0">
                <div className="flex flex-col md:flex-row gap-6">
                    <Card className="flex-1">
                        <CardContent className="p-0 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                locale={tr}
                                className="rounded-md border p-6 w-full"
                                // Highlight days with promises using modifiers
                                modifiers={{
                                    hasPromise: (date) => {
                                        const d = format(date, 'yyyy-MM-dd')
                                        return promisesByDate.has(d)
                                    }
                                }}
                                modifiersClassNames={{
                                    hasPromise: "font-bold text-primary underline decoration-primary decoration-2 underline-offset-4"
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card className="flex-1 min-h-[400px]">
                        <CardHeader>
                            <CardTitle>
                                {date ? format(date, 'd MMMM yyyy', { locale: tr }) : 'Tarih Seçin'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderPromiseList(selectedPromises)}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="week" className="mt-0">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={prevWeek}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={nextWeek}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={resetWeek}>
                                    Bu Hafta
                                </Button>
                            </div>
                            <CardTitle>
                                {format(weekStart, 'd MMMM', { locale: tr })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: tr })}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const currentDay = addDays(weekStart, i)
                            const dateStr = format(currentDay, 'yyyy-MM-dd')
                            const dayPromises = promisesByDate.get(dateStr) || []
                            const isToday = isSameDay(currentDay, new Date())

                            return (
                                <Card key={dateStr} className={`border ${isToday ? 'border-primary shadow-sm' : 'border-border'}`}>
                                    <CardHeader className="py-3 bg-muted/20">
                                        <CardTitle className="text-sm font-medium flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold">{format(currentDay, 'd', { locale: tr })}</span>
                                                <span className="text-muted-foreground">{format(currentDay, 'MMMM EEEE', { locale: tr })}</span>
                                            </div>
                                            {isToday && <Badge>Bugün</Badge>}
                                            {dayPromises.length > 0 && (
                                                <Badge variant="secondary" className="ml-2">
                                                    {dayPromises.length} Söz
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-3">
                                        {renderPromiseList(dayPromises)}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
