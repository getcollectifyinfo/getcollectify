'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CalendarViewProps {
    promises: any[]
}

export function CalendarView({ promises }: CalendarViewProps) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    // Group promises by date for generic lookup
    const promisesByDate = React.useMemo(() => {
        const map = new Map<string, any[]>()
        promises.forEach(p => {
            const d = new Date(p.promise_date).toISOString().split('T')[0]
            if (!map.has(d)) map.set(d, [])
            map.get(d)?.push(p)
        })
        return map
    }, [promises])

    const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : ''
    const selectedPromises = promisesByDate.get(selectedDateStr) || []

    return (
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
                    {selectedPromises.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Bu tarihte ödeme sözü bulunmuyor.</p>
                    ) : (
                        <div className="space-y-4">
                            {selectedPromises.map((promise) => (
                                <div key={promise.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                    <div className="space-y-1">
                                        <div className="font-semibold">{promise.customers?.name}</div>
                                        {promise.note && <div className="text-sm text-muted-foreground">{promise.note}</div>}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{Number(promise.amount).toLocaleString('tr-TR')} {promise.currency}</div>
                                        <Badge variant={promise.status === 'pending' ? 'secondary' : promise.status === 'kept' ? 'default' : 'destructive'} className='text-[10px]'>
                                            {promise.status === 'pending' ? 'Bekliyor' : promise.status === 'kept' ? 'Tuttu' : 'Tutmadı'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
