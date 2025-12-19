
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function CustomersPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const supabase = await createClient()

    // RLS will enforce company isolation automatically
    const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('archived', false)
        .order('name')

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold md:text-2xl">Müşteriler</h1>
                <Button asChild>
                    <Link href={`/customers/new`}>
                        <Plus className="mr-2 h-4 w-4" /> Yeni Müşteri
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>İsim</TableHead>
                            <TableHead>Telefon</TableHead>
                            <TableHead>Oluşturulma</TableHead>
                            <TableHead className="text-right">Bakiye</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Henüz müşteri bulunmuyor.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers?.map((customer: any) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/customers/${customer.id}`} className="hover:underline">
                                            {customer.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{customer.phone || '-'}</TableCell>
                                    <TableCell>{new Date(customer.created_at).toLocaleDateString('tr-TR')}</TableCell>
                                    {/* Bakiye would need a join or separate fetch for total debt */}
                                    <TableCell className="text-right">₺0.00</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
