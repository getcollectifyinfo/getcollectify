'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import EditCustomerModal from '@/components/edit-customer-modal'
import { deleteCustomer } from '@/app/actions/delete-customer'
import { toast } from 'sonner'

interface Customer {
    id: string
    name: string
    phone?: string | null
    created_at: string
    assigned_user_id?: string | null
    profiles?: {
        name: string | null
    } | null
}

interface CustomersClientProps {
    customers: Customer[]
    currentUserRole: string
}

export default function CustomersClient({ customers, currentUserRole }: CustomersClientProps) {
    const canDelete = ['company_admin', 'accounting', 'manager'].includes(currentUserRole)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer)
        setEditModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu müşteriyi ve ilişkili tüm borçları/notları silmek istediğinize emin misiniz?')) {
            return
        }

        const result = await deleteCustomer(id)
        if (result.success) {
            toast.success('Müşteri silindi')
        } else {
            toast.error(result.error || 'Silinirken hata oluştu')
        }
    }

    return (
        <>
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>İsim</TableHead>
                            <TableHead>Telefon</TableHead>
                            <TableHead>Satış Temsilcisi</TableHead>
                            <TableHead>Oluşturulma</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Henüz müşteri bulunmuyor.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/customers/${customer.id}`} className="hover:underline">
                                            {customer.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{customer.phone || '-'}</TableCell>
                                    <TableCell>
                                        {customer.profiles?.name || '-'}
                                    </TableCell>
                                    <TableCell>{new Date(customer.created_at).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                title="Düzenle"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEdit(customer)
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {canDelete && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="Sil"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(customer.id)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedCustomer && (
                <EditCustomerModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    customer={selectedCustomer}
                />
            )}
        </>
    )
}
