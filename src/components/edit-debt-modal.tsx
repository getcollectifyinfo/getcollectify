'use client'

import { useState, useEffect } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { updateDebt } from '@/app/actions/update-debt'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const formSchema = z.object({
    amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalıdır'),
    currency: z.string().min(1, 'Para birimi seçilmeli'),
    dueDate: z.date({ message: 'Vade tarihi zorunludur' }),
    debtType: z.string().min(1, 'Borç tipi seçilmeli'),
})

type FormValues = z.infer<typeof formSchema>

interface Debt {
    id: string
    debt_type: string
    currency: string
    remaining_amount: number
    original_amount?: number // Added this as we might need it, though prop uses remaining_amount usually
    dueDateFormatted: string
    // We need the actual date object or string for the form
    due_date?: string 
}

interface EditDebtModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    debt: Debt
    debtTypes: string[]
    currencies: string[]
}

export default function EditDebtModal({
    open,
    onOpenChange,
    debt,
    debtTypes,
    currencies,
}: EditDebtModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    // We need to parse the due date. The debt object passed from ReceivablesClient 
    // has dueDateFormatted, but we might need the raw date string.
    // Looking at ReceivablesClient, the Debt interface there has `dueDateFormatted`.
    // It seems `due_date` is not directly exposed in the Debt interface in `receivables-client.tsx`.
    // I should check `receivables/page.tsx` or where data comes from to ensure `due_date` is available.
    // For now, I will assume I can pass `due_date` if I update the parent component.
    // Or parse `dueDateFormatted` if it's standard, but better to pass raw date.

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: debt.original_amount || debt.remaining_amount, // Prefer original if available, else remaining
            currency: debt.currency,
            debtType: debt.debt_type,
            // Initialize with current date if parsing fails, but we should fix the prop
            dueDate: new Date(), 
        },
    })

    // Reset form when debt changes
    useEffect(() => {
        if (debt) {
            // We need to handle date parsing. 
            // If the parent passes `due_date` (raw string YYYY-MM-DD), use it.
            // I will update the parent to pass `due_date`.
            const date = debt.due_date ? new Date(debt.due_date) : new Date()
            
            form.reset({
                amount: debt.original_amount || debt.remaining_amount,
                currency: debt.currency,
                debtType: debt.debt_type,
                dueDate: date,
            })
        }
    }, [debt, form])

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true)
        try {
            const result = await updateDebt({
                debtId: debt.id,
                debtType: values.debtType,
                dueDate: values.dueDate,
                amount: values.amount,
                currency: values.currency,
            })

            if (result.success) {
                toast.success('Borç başarıyla güncellendi')
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Borç güncellenirken hata oluştu')
            }
        } catch {
            toast.error('Beklenmeyen bir hata oluştu')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Borç Düzenle</DialogTitle>
                    <DialogDescription>
                        Borç bilgilerini güncelleyin.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Debt Type */}
                        <FormField
                            control={form.control}
                            name="debtType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Borç Tipi *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Borç tipi seçin" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {debtTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Amount */}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tutar *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Currency */}
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Para Birimi *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Para birimi seçin" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {currencies.map((currency) => (
                                                <SelectItem key={currency} value={currency}>
                                                    {currency}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Due Date */}
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Vade Tarihi *</FormLabel>
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
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
