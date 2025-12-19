'use client'

import { useState, useEffect, useActionState } from 'react'
import { createNote } from '@/app/actions/notes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from 'lucide-react'

interface NotesTabProps {
    customerId: string
    notes: any[]
}

interface ActionState {
    message: string
    error: string
    success: boolean
}

const initialState: ActionState = {
    message: '',
    error: '',
    success: false
}

export default function NotesTab({ customerId, notes }: NotesTabProps) {
    const [open, setOpen] = useState(false)
    const [state, formAction, isPending] = useActionState(createNote, initialState)

    useEffect(() => {
        if (state.success && !state.error) {
            setOpen(false)
        }
    }, [state.success, state.error])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notlar</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Not Ekle</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Yeni Not Ekle</DialogTitle>
                            <DialogDescription>
                                Müşteri ile ilgili notunuzu girin.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={formAction} className="grid gap-4 py-4">
                            <input type="hidden" name="customerId" value={customerId} />

                            {state.error && (
                                <div className="text-red-500 text-sm mb-2">{state.error}</div>
                            )}

                            <div className="grid gap-2">
                                <Textarea id="content" name="content" placeholder="Notunuzu buraya yazın..." required />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {notes?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Henüz not eklenmemiş.</p>
                ) : (
                    <div className="space-y-4">
                        {notes?.map((note: any) => (
                            <div key={note.id} className="border-b pb-4 last:border-0 last:pb-0">
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{new Date(note.created_at).toLocaleString('tr-TR')}</span>
                                    {/* User name join could be done here if expanded */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
