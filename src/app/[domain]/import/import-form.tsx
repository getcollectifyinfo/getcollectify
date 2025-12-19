'use client'

import { useState } from 'react' // File upload usually needs traditional onSubmit due to file handling nuances or useActionState
import { uploadImportFile } from '@/app/actions/import'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Yükleniyor...' : 'Dosyayı Yükle ve Başlat'}
        </Button>
    )
}

export default function ImportForm({ jobs }: { jobs: any[] }) {
    const [message, setMessage] = useState('')

    async function clientAction(formData: FormData) {
        setMessage('')
        const result = await uploadImportFile(formData)
        if (result?.error) {
            setMessage('Hata: ' + result.error)
        } else if (result?.message) {
            setMessage(result.message)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Dosya Yükleme</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={clientAction} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="file">CSV Dosyası</Label>
                            <Input id="file" name="file" type="file" accept=".csv" required />
                            <p className="text-xs text-muted-foreground">Örnek format: Ad, Telefon, Borç Tutar, Vade Tarihi</p>
                        </div>
                        {message && (
                            <div className={`text-sm ${message.startsWith('Hata') ? 'text-red-500' : 'text-green-500'}`}>
                                {message}
                            </div>
                        )}
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Son Yüklemeler</CardTitle>
                </CardHeader>
                <CardContent>
                    {jobs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Geçmiş işlem bulunamadı.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dosya</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Kayıt</TableHead>
                                    <TableHead>Tarih</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell>{job.filename}</TableCell>
                                        <TableCell>
                                            <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                                                {job.status === 'completed' ? 'Tamamlandı' : job.status === 'failed' ? 'Hata' : 'İşleniyor'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{job.inserted_count}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleString('tr-TR')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
