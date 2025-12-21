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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { searchCustomers } from '@/app/actions/search-customers'
import { createReceivable } from '@/app/actions/create-receivable'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const formSchema = z.object({
    customerId: z.string().optional(),
    customerName: z.string().min(1, 'Müşteri adı zorunludur'),
    amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalıdır'),
    currency: z.string().min(1, 'Para birimi seçilmeli'),
    dueDate: z.date({ required_error: 'Vade tarihi zorunludur' }),
    debtType: z.string().min(1, 'Borç tipi seçilmeli'),
    notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddReceivableModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    companyId: string
    debtTypes: string[]
    currencies: string[]
}

export default function AddReceivableModal({
    open,
    onOpenChange,
    companyId,
    debtTypes,
    currencies,
}: AddReceivableModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customerSearch, setCustomerSearch] = useState('')
    const [customers, setCustomers] = useState<any[]>([])
    const [customerOpen, setCustomerOpen] = useState(false)
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customerId: '',
            customerName: '',
            amount: 0,
            currency: currencies[0] || 'TRY',
            debtType: debtTypes[0] || 'Cari',
            notes: '',
        },
    })

    // Search customers as user types
    useEffect(() => {
        if (customerSearch.length > 1) {
            searchCustomers(customerSearch, companyId).then(result => {
                setCustomers(result.customers)
            })
        } else {
            setCustomers([])
        }
    }, [customerSearch, companyId])

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true)
        try {
            const result = await createReceivable({
                ...values,
                companyId,
            })

            if (result.success) {
                toast.success('Alacak başarıyla eklendi')
                form.reset()
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Alacak eklenirken hata oluştu')
            }
        } catch (error) {
            toast.error('Beklenmeyen bir hata oluştu')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Alacak Ekle</DialogTitle>
                    <DialogDescription>
                        Yeni bir alacak kaydı oluşturun. Müşteri mevcut değilse otomatik oluşturulacaktır.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Customer Autocomplete */}
                        <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Müşteri *</FormLabel>
                                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        'w-full justify-between',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value || 'Müşteri seçin veya yeni ekleyin'}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Müşteri ara..."
                                                    value={customerSearch}
                                                    onValueChange={setCustomerSearch}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        {customerSearch ? `"${customerSearch}" adında yeni müşteri oluştur` : 'Müşteri bulunamadı'}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {customers.map((customer) => (
                                                            <CommandItem
                                                                key={customer.id}
                                                                value={customer.name}
                                                                onSelect={() => {
                                                                    form.setValue('customerId', customer.id)
                                                                    form.setValue('customerName', customer.name)
                                                                    setCustomerOpen(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        customer.id === form.getValues('customerId')
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>{customer.name}</span>
                                                                    {customer.totalDebt > 0 && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            Mevcut borç: {new Intl.NumberFormat('tr-TR', {
                                                                                style: 'currency',
                                                                                currency: customer.currency
                                                                            }).format(customer.totalDebt)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                        {customerSearch && customers.length === 0 && (
                                                            <CommandItem
                                                                value={customerSearch}
                                                                onSelect={() => {
                                                                    form.setValue('customerId', '')
                                                                    form.setValue('customerName', customerSearch)
                                                                    setCustomerOpen(false)
                                                                }}
                                                            >
                                                                <Check className="mr-2 h-4 w-4 opacity-0" />
                                                                Yeni müşteri: "{customerSearch}"
                                                            </CommandItem>
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
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

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notlar (Opsiyonel)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ek bilgiler..."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
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
                                {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
