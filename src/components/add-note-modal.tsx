'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { createNote } from '@/app/actions/create-note'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const formSchema = z.object({
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    noteText: z.string().min(1, 'Not metni zorunludur'),
    promiseDate: z.date().optional(),
    promiseAmount: z.number().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddNoteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customerId: string
    debtId?: string
    debtAmount?: number
    currency?: string
}

export default function AddNoteModal({
    open,
    onOpenChange,
    customerId,
    debtId,
    debtAmount,
    currency = 'TRY',
}: AddNoteModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            contactPerson: '',
            phone: '',
            noteText: '',
            promiseDate: undefined,
            promiseAmount: debtAmount,
        },
    })

    const promiseDate = form.watch('promiseDate')

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true)
        try {
            const result = await createNote({
                customerId,
                debtId,
                contactPerson: values.contactPerson || undefined,
                phone: values.phone || undefined,
                noteText: values.noteText,
                promiseDate: values.promiseDate,
                promiseAmount: values.promiseAmount,
                currency,
            })

            if (result.success) {
                toast.success('Not başarıyla eklendi')
                form.reset()
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Not eklenirken hata oluştu')
            }
        } catch (error) {
            toast.error('Beklenmeyen bir hata oluştu')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Not Ekle</DialogTitle>
                    <DialogDescription>
                        Müşteri ile görüşme notunu kaydedin. İsteğe bağlı olarak kişi bilgisi ve ödeme sözü ekleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Görüşülen Kişi (Opsiyonel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: Ahmet Yılmaz" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefon (Opsiyonel)</FormLabel>
                                    <FormControl>
                                        <Input type="tel" placeholder="Örn: 0532 123 4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="noteText"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Not *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Görüşme detaylarını yazın..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="promiseDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Ödeme Sözü Tarihi (Opsiyonel)</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'PPP', { locale: tr })
                                                    ) : (
                                                        <span>Tarih seçin</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {promiseDate && (
                            <FormField
                                control={form.control}
                                name="promiseAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Söz Verilen Tutar ({currency})</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="Tutar"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                İptal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
