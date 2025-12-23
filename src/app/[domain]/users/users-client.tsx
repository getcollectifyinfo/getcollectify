'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, UserPlus, Shield, User, Mail, Users as UsersIcon, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createUser } from '@/app/actions/create-user'
import { updateUser } from '@/app/actions/update-user'
import { deleteUser } from '@/app/actions/delete-user'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Profile {
    id: string
    name: string
    email: string
    role: string
    active: boolean
    manager: {
        id: string
        name: string
    } | null
}

interface UsersClientProps {
    initialUsers: Profile[]
    isDemo: boolean
}

const ROLE_LABELS: Record<string, string> = {
    company_admin: 'Şirket Yöneticisi',
    manager: 'Satış Yöneticisi',
    seller: 'Satış Temsilcisi',
    accounting: 'Muhasebe',
    admin: 'Admin'
}

const ROLE_COLORS: Record<string, string> = {
    company_admin: 'bg-purple-100 text-purple-700 border-purple-200',
    manager: 'bg-blue-100 text-blue-700 border-blue-200',
    seller: 'bg-green-100 text-green-700 border-green-200',
    accounting: 'bg-orange-100 text-orange-700 border-orange-200',
    admin: 'bg-red-100 text-red-700 border-red-200'
}

export default function UsersClient({ initialUsers, isDemo }: UsersClientProps) {
    const [createOpen, setCreateOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleCreateSubmit(formData: FormData) {
        setLoading(true)
        try {
            const result = await createUser(null, formData)
            
            if (result?.success) {
                toast.success(result.message)
                setCreateOpen(false)
                router.refresh()
            } else if (result?.message) {
                toast.error(result.message)
            } else if (result?.errors) {
                const firstError = Object.values(result.errors)[0]
                if (firstError) toast.error(firstError[0])
            }
        } catch (_error) {
            toast.error('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateSubmit(formData: FormData) {
        setLoading(true)
        try {
            const result = await updateUser(null, formData)
            
            if (result?.success) {
                toast.success(result.message)
                setEditOpen(false)
                setSelectedUser(null)
                router.refresh()
            } else if (result?.message) {
                toast.error(result.message)
            } else if (result?.errors) {
                const firstError = Object.values(result.errors)[0]
                if (firstError) toast.error(firstError[0])
            }
        } catch (_error) {
            toast.error('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteConfirm() {
        if (!selectedUser) return

        setLoading(true)
        try {
            const result = await deleteUser(selectedUser.id, selectedUser.email)
            
            if (result?.success) {
                toast.success(result.message)
                setDeleteOpen(false)
                setSelectedUser(null)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (_error) {
            toast.error('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const openEditDialog = (user: Profile) => {
        setSelectedUser(user)
        setEditOpen(true)
    }

    const openDeleteDialog = (user: Profile) => {
        setSelectedUser(user)
        setDeleteOpen(true)
    }

    const isDefaultUser = (email: string) => email.endsWith('@collectify.com')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Kullanıcılar</h2>
                    <p className="text-muted-foreground">
                        Şirket çalışanlarını ve rollerini yönetin.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Yeni Kullanıcı Ekle
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Yönetici</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {user.name}
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={ROLE_COLORS[user.role] || ''}>
                                        {ROLE_LABELS[user.role] || user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.manager ? (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Shield className="h-3 w-3" />
                                            {user.manager.name}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.active ? 'default' : 'secondary'} className={user.active ? 'bg-green-500 hover:bg-green-600' : ''}>
                                        {user.active ? 'Aktif' : 'Pasif'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(user)}
                                            disabled={isDefaultUser(user.email)}
                                            title={isDefaultUser(user.email) ? "Varsayılan kullanıcılar düzenlenemez" : "Düzenle"}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDeleteDialog(user)}
                                            disabled={isDefaultUser(user.email)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            title={isDefaultUser(user.email) ? "Varsayılan kullanıcılar silinemez" : "Sil"}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {initialUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Henüz kullanıcı bulunmuyor.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                        <DialogDescription>
                            Yeni bir şirket çalışanı oluşturun. {isDemo && "Demo modunda şifre otomatik olarak 'Demo1234' atanacaktır."}
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleCreateSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Ad Soyad</Label>
                            <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="name" name="name" placeholder="Ad Soyad" className="pl-9" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Adresi</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" className="pl-9" required />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input 
                                id="password" 
                                name="password" 
                                type="password"
                                placeholder="******" 
                                minLength={6} 
                                required 
                                defaultValue={isDemo ? "Demo1234" : ""}
                                readOnly={isDemo}
                                className={isDemo ? "bg-muted text-muted-foreground" : ""}
                            />
                            {isDemo && (
                                <p className="text-xs text-muted-foreground">
                                    Demo modunda şifre sabitlenmiştir.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Rol</Label>
                                <Select name="role" required defaultValue="seller">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Rol seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="seller">Satış Temsilcisi</SelectItem>
                                        <SelectItem value="manager">Satış Yöneticisi</SelectItem>
                                        <SelectItem value="accounting">Muhasebe</SelectItem>
                                        <SelectItem value="company_admin">Şirket Yöneticisi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manager_id">Yönetici</Label>
                                <Select name="manager_id" defaultValue="none">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Yönetici seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Yok</SelectItem>
                                        {initialUsers
                                            .filter(u => ['manager', 'company_admin'].includes(u.role))
                                            .map(manager => (
                                                <SelectItem key={manager.id} value={manager.id}>
                                                    {manager.name}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Ekleniyor...' : 'Kullanıcı Oluştur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Kullanıcı Düzenle</DialogTitle>
                        <DialogDescription>
                            Kullanıcı bilgilerini güncelleyin.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <form action={handleUpdateSubmit} className="space-y-4 py-4">
                            <input type="hidden" name="id" value={selectedUser.id} />
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Ad Soyad</Label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-name" name="name" defaultValue={selectedUser.name} className="pl-9" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email Adresi</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-email" name="email" type="email" defaultValue={selectedUser.email} className="pl-9" required />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Rol</Label>
                                    <Select name="role" required defaultValue={selectedUser.role}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Rol seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="seller">Satış Temsilcisi</SelectItem>
                                            <SelectItem value="manager">Satış Yöneticisi</SelectItem>
                                            <SelectItem value="accounting">Muhasebe</SelectItem>
                                            <SelectItem value="company_admin">Şirket Yöneticisi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-manager_id">Yönetici</Label>
                                    <Select name="manager_id" defaultValue={selectedUser.manager?.id || "none"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Yönetici seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Yok</SelectItem>
                                            {initialUsers
                                                .filter(u => ['manager', 'company_admin'].includes(u.role) && u.id !== selectedUser.id)
                                                .map(manager => (
                                                    <SelectItem key={manager.id} value={manager.id}>
                                                        {manager.name}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                                    İptal
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Güncelleniyor...' : 'Güncelle'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Kullanıcıyı Sil</DialogTitle>
                        <DialogDescription>
                            Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="py-4">
                            <p className="font-medium">{selectedUser.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                            İptal
                        </Button>
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDeleteConfirm}
                            disabled={loading}
                        >
                            {loading ? 'Siliniyor...' : 'Evet, Sil'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
