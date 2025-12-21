'use client'

import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Phone, Calendar } from 'lucide-react'

interface Note {
    id: string
    created_at: string
    contact_person?: string
    phone?: string
    text?: string
    promised_date?: string
    profiles?: {
        name: string
    }
}

interface Promise {
    id: string
    created_at: string
    promised_date: string
    amount?: number
    currency: string
    status: string
    profiles?: {
        name: string
    }
}

interface TimelineEntry {
    id: string
    type: 'note' | 'promise'
    created_at: string
    icon: 'phone' | 'calendar'
    data: Note | Promise
}

interface CustomerTimelineProps {
    notes: Note[]
    promises: Promise[]
}

export default function CustomerTimeline({ notes, promises }: CustomerTimelineProps) {
    // Combine and sort timeline entries
    const timelineEntries: TimelineEntry[] = [
        ...notes.map(note => ({
            id: note.id,
            type: 'note' as const,
            created_at: note.created_at,
            icon: (note.contact_person || note.phone) ? 'phone' as const : 'calendar' as const,
            data: note,
        })),
        ...promises.map(promise => ({
            id: promise.id,
            type: 'promise' as const,
            created_at: promise.created_at,
            icon: 'calendar' as const,
            data: promise,
        })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (timelineEntries.length === 0) {
        return (
            <div className="py-4 px-6 text-sm text-muted-foreground">
                Henüz not veya ödeme sözü bulunmuyor.
            </div>
        )
    }

    return (
        <div className="py-4 px-6">
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {/* Timeline entries */}
                <div className="space-y-6">
                    {timelineEntries.map((entry, index) => (
                        <div key={entry.id} className="relative pl-10">
                            {/* Dot */}
                            <div className="absolute left-3 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />

                            {/* Icon */}
                            <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {entry.icon === 'phone' ? (
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                {/* Header */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                                    </span>
                                    {entry.data.profiles?.name && (
                                        <span>Görüşen: {entry.data.profiles.name}</span>
                                    )}
                                </div>

                                {/* Note content */}
                                {entry.type === 'note' && (
                                    <div className="space-y-1">
                                        {(entry.data as Note).contact_person && (
                                            <div className="text-sm font-medium">
                                                {(entry.data as Note).contact_person}
                                                {(entry.data as Note).phone && (
                                                    <span className="text-muted-foreground ml-2">
                                                        ({(entry.data as Note).phone})
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {(entry.data as Note).text && (
                                            <p className="text-sm">{(entry.data as Note).text}</p>
                                        )}
                                        {(entry.data as Note).promised_date && (
                                            <div className="text-sm text-primary font-medium">
                                                📅 Ödeme Sözü: {format(new Date((entry.data as Note).promised_date!), 'dd MMM yyyy', { locale: tr })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Promise content */}
                                {entry.type === 'promise' && (
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium">Ödeme Sözü</div>
                                        <div className="text-sm">
                                            Tarih: {format(new Date((entry.data as Promise).promised_date), 'dd MMM yyyy', { locale: tr })}
                                        </div>
                                        {(entry.data as Promise).amount && (
                                            <div className="text-sm">
                                                Tutar: {new Intl.NumberFormat('tr-TR', {
                                                    style: 'currency',
                                                    currency: (entry.data as Promise).currency
                                                }).format((entry.data as Promise).amount!)}
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                            Durum: {(entry.data as Promise).status === 'planned' ? 'Planlandı' :
                                                (entry.data as Promise).status === 'kept' ? 'Tutuldu' : 'Tutulmadı'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
