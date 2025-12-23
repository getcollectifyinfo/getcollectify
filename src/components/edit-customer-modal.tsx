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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateCustomer } from '@/app/actions/update-customer'
import { toast } from 'sonner'

const formSchema = z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    phone: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditCustomerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer: {
        id: string
        name: string
        phone?: string | null
    }
}

export default function EditCustomerModal({
    open,
    onOpenChange,
    customer,
}: EditCustomerModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: customer.name,
            phone: customer.phone || '',
        },
    })

    // Reset form when customer changes
    useEffect(() => {
        if (open) {
            form.reset({
                name: customer.name,
                phone: customer.phone || '',
            })
        }
    }, [customer, open, form])

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true)
        try {
            const result = await updateCustomer({
                customerId: customer.id,
                name: values.name,
                phone: values.phone,
            })

            if (result.success) {
                toast.success('Müşteri başarıyla güncellendi')
                onOpenChange(false)
            } else {
                toast.error(result.error || 'Bir hata oluştu')
            }
        } catch (error) {
            toast.error('Beklenmeyen bir hata oluştu')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Müşteri Düzenle</DialogTitle>
                    <DialogDescription>
                        Müşteri bilgilerini güncelleyin.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Müşteri Ünvanı</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
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
                                    <FormLabel>Telefon</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2 pt-4">
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
