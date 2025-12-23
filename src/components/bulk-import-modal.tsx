'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, Download, Loader2, AlertCircle, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { bulkImportReceivables } from '@/app/actions/bulk-import-receivables'
import { analyzeBulkImport, AnalyzedRow } from '@/app/actions/analyze-bulk-import'
import { createUser } from '@/app/actions/create-user'
import { getUsers } from '@/app/actions/get-users'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface BulkImportModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    companyId: string
}

// Reuse the type structure from server actions
interface ImportRow {
    customerName: string
    dueDate: string
    amount: number
    currency: string
    debtType: string
    salesRepName: string
    transactionDate?: string
}

export default function BulkImportModal({
    open,
    onOpenChange,
    companyId,
}: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<AnalyzedRow[]>([])
    const [analysisSummary, setAnalysisSummary] = useState<{
        toCreate: number
        toUpdate: number
        toDelete: number
        toSkip: number
        errors: number
    } | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'result'>('upload')
    const [result, setResult] = useState<{
        stats?: { created: number; updated: number; deleted: number; skipped: number }
        errors?: string[]
    } | null>(null)
    
    // Add User Modal State
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'seller', manager_id: 'none' })
    const [isCreatingUser, setIsCreatingUser] = useState(false)
    const [parsedRows, setParsedRows] = useState<ImportRow[]>([])
    const [managers, setManagers] = useState<{ id: string, name: string }[]>([])

    const fileInputRef = useRef<HTMLInputElement>(null)

    const downloadTemplate = () => {
        const headers = [
            'Müşteri',
            'Vade Tarihi (GG.AA.YYYY)',
            'Tutar',
            'Para Birimi (TRY/USD/EUR)',
            'Borç Tipi (Cari/Çek/Senet)',
            'Satış Temsilcisi',
            'İşlem Tarihi (Opsiyonel)'
        ]
        
        const exampleData = [
            ['Örnek Müşteri Ltd. Şti.', '20.05.2024', '15000', 'TRY', 'Cari', 'Ahmet Yılmaz', '15.01.2024'],
            ['ABC Teknoloji A.Ş.', '15.06.2024', '2500', 'USD', 'Çek', 'Ayşe Demir', '']
        ]

        const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Şablon')
        XLSX.writeFile(wb, 'alacak_yukleme_sablonu.xlsx')
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

                // Skip header row
                const rows = data.slice(1).filter(row => row.length > 0)
                
                const formattedData: ImportRow[] = rows.map((row) => ({
                    customerName: String(row[0] || ''),
                    dueDate: formatDate(row[1]),
                    amount: Number(row[2]) || 0,
                    currency: mapCurrency(row[3]),
                    debtType: mapDebtType(row[4]),
                    salesRepName: String(row[5] || ''),
                    transactionDate: row[6] ? formatDate(row[6]) : undefined
                }))

                // Basic local validation (just to ensure we don't send complete garbage)
                const validData = formattedData.filter(d => 
                    d.customerName || d.amount > 0
                )

                setParsedRows(validData)

                if (validData.length === 0) {
                    toast.error('Dosyada geçerli veri bulunamadı veya format hatalı.')
                    setFile(null)
                    return
                }

                // Call server for analysis
                setIsAnalyzing(true)
                analyzeBulkImport(companyId, validData)
                    .then((res) => {
                        if (res.success) {
                            setPreviewData(res.rows)
                            setAnalysisSummary(res.summary)
                            setStep('preview')
                        } else {
                            toast.error(res.message)
                            setFile(null)
                        }
                    })
                    .catch(() => {
                        toast.error('Analiz sırasında hata oluştu.')
                        setFile(null)
                    })
                    .finally(() => {
                        setIsAnalyzing(false)
                    })

            } catch (error) {
                console.error('Excel parse error:', error)
                toast.error('Excel dosyası okunamadı.')
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
        reader.readAsBinaryString(selectedFile)
    }

    const formatDate = (val: unknown) => {
        if (!val) return ''
        // Handle Excel date number
        if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return date.toISOString().split('T')[0]
        }
        
        const strVal = String(val).trim()
        
        // Handle DD.MM.YYYY format
        if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(strVal)) {
            const [day, month, year] = strVal.split('.')
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }

        // Handle YYYY-MM-DD or other formats (fallback)
        return strVal
    }

    const mapCurrency = (val: unknown) => {
        const s = String(val).toUpperCase().trim()
        if (s === 'TL' || s === 'TRY') return 'TRY'
        if (s === 'USD' || s === 'DOLAR') return 'USD'
        if (s === 'EUR' || s === 'EURO') return 'EUR'
        return 'TRY' // Default
    }

    const mapDebtType = (val: unknown) => {
        const s = String(val).toLowerCase().trim()
        if (s?.includes('çek') || s?.includes('cek')) return 'Çek'
        if (s?.includes('senet')) return 'Senet'
        return 'Cari' // Default
    }

    const handleProcess = async () => {
        setStep('processing')
        try {
            // Filter out 'delete' and 'error' rows, only send 'create', 'update', 'skip'
            const dataToProcess = previewData
                .filter(row => row.status !== 'delete' && row.status !== 'error')
                .map(row => row.data)

            const result = await bulkImportReceivables(companyId, dataToProcess)
            setResult({
                stats: result.stats,
                errors: result.errors
            })
            setStep('result')
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (_error) {
            toast.error('İşlem sırasında bir hata oluştu.')
            setStep('preview')
        }
    }

    const reset = () => {
        setFile(null)
        setPreviewData([])
        setResult(null)
        setStep('upload')
        setParsedRows([])
        if (fileInputRef.current) fileInputRef.current.value = ''
        onOpenChange(false)
    }

    // Add User Functions
    const handleAddUser = async (name: string) => {
        setNewUser({ name, email: '', role: 'seller', manager_id: 'none' })
        setIsAddUserOpen(true)
        
        try {
            const { users } = await getUsers()
            if (users) {
                const potentialManagers = users
                    .filter((u: { role: string }) => ['manager', 'company_admin'].includes(u.role))
                    .map((u: { id: string; name: string }) => ({ id: u.id, name: u.name }))
                setManagers(potentialManagers)
            }
        } catch (error) {
            console.error('Failed to fetch managers', error)
        }
    }

    const handleCreateUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreatingUser(true)

        const formData = new FormData()
        formData.append('name', newUser.name)
        formData.append('email', newUser.email)
        formData.append('role', newUser.role)
        if (newUser.manager_id) {
            formData.append('manager_id', newUser.manager_id)
        }
        // Default password for demo or simple creation flow
        formData.append('password', '123456') 

        try {
            const result = await createUser(null, formData)
            if (result?.success) {
                toast.success('Kullanıcı oluşturuldu')
                setIsAddUserOpen(false)
                // Optional: Auto refresh? Let user click refresh.
            } else {
                toast.error(result?.message || 'Kullanıcı oluşturulamadı')
            }
        } catch (_error) {
            toast.error('Bir hata oluştu')
        } finally {
            setIsCreatingUser(false)
        }
    }

    const handleRefresh = () => {
        if (parsedRows.length === 0) return
        
        setIsAnalyzing(true)
        analyzeBulkImport(companyId, parsedRows)
            .then((res) => {
                if (res.success) {
                    setPreviewData(res.rows)
                    setAnalysisSummary(res.summary)
                    toast.success('Analiz güncellendi')
                } else {
                    toast.error(res.message)
                }
            })
            .catch(() => {
                toast.error('Yeniden analiz sırasında hata oluştu.')
            })
            .finally(() => {
                setIsAnalyzing(false)
            })
    }

    return (
        <>
        <Dialog open={open} onOpenChange={(val) => !val && reset()}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Toplu Alacak Yükleme</DialogTitle>
                    <DialogDescription>
                        Excel dosyası ile toplu alacak ekleyebilir, güncelleyebilir veya silebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' && (
                    <div className="space-y-6 py-4">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Dikkat</AlertTitle>
                            <AlertDescription>
                                Bu işlem &quot;Tam Senkronizasyon&quot; modunda çalışır. Excel listesinde olmayan ancak sistemde &quot;Açık&quot; durumdaki kayıtlar silinecektir. Lütfen güncel ve tam listeyi yüklediğinizden emin olun.
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-10 bg-muted/50">
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <div className="text-center">
                                <Button 
                                    variant="outline" 
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Excel Dosyası Seç
                                </Button>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {file ? file.name : 'Veya dosyayı sürükleyip bırakın'}
                                </p>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div className="flex justify-center">
                            <Button variant="link" onClick={downloadTemplate} className="gap-2">
                                <Download className="h-4 w-4" />
                                Örnek Şablon İndir
                            </Button>
                        </div>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Veriler analiz ediliyor...</p>
                    </div>
                )}

                {step === 'preview' && !isAnalyzing && analysisSummary && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2 text-center text-sm">
                            <div className="bg-green-50 p-2 rounded border border-green-100">
                                <div className="font-bold text-green-700">{analysisSummary.toCreate}</div>
                                <div className="text-green-600">Yeni</div>
                            </div>
                            <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                <div className="font-bold text-blue-700">{analysisSummary.toUpdate}</div>
                                <div className="text-blue-600">Güncelleme</div>
                            </div>
                            <div className="bg-red-50 p-2 rounded border border-red-100">
                                <div className="font-bold text-red-700">{analysisSummary.toDelete}</div>
                                <div className="text-red-600">Silinecek</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                <div className="font-bold text-gray-700">{analysisSummary.toSkip}</div>
                                <div className="text-gray-600">Değişmeyen</div>
                            </div>
                        </div>

                        {analysisSummary.errors > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Hata</AlertTitle>
                                <AlertDescription>
                                    {analysisSummary.errors} adet satırda hata bulundu. Lütfen düzeltip tekrar yükleyin.
                                </AlertDescription>
                            </Alert>
                        )}

                        <ScrollArea className="h-[300px] border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Durum</TableHead>
                                        <TableHead>Müşteri</TableHead>
                                        <TableHead>Vade</TableHead>
                                        <TableHead>Tutar</TableHead>
                                        <TableHead>Açıklama</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, i) => (
                                        <TableRow key={i} className={
                                            row.status === 'delete' ? 'bg-red-50/50' : 
                                            row.status === 'error' ? 'bg-red-100/50' : ''
                                        }>
                                            <TableCell>
                                                {row.status === 'create' && <Badge className="bg-green-500">Yeni</Badge>}
                                                {row.status === 'update' && <Badge className="bg-blue-500">Güncelle</Badge>}
                                                {row.status === 'delete' && <Badge variant="destructive">Sil</Badge>}
                                                {row.status === 'skip' && <Badge variant="secondary">Aynı</Badge>}
                                                {row.status === 'error' && <Badge variant="destructive">Hata</Badge>}
                                            </TableCell>
                                            <TableCell className="font-medium">{row.data.customerName}</TableCell>
                                            <TableCell>{row.data.dueDate}</TableCell>
                                            <TableCell>
                                                {row.data.amount} {row.data.currency}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <span>{row.message || row.data.salesRepName}</span>
                                                    {row.status === 'error' && (row.errorCode === 'SALES_REP_NOT_FOUND' || row.message?.toLowerCase().includes('satış temsilcisi bulunamadı')) && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-6 px-2 text-xs"
                                                            onClick={() => handleAddUser(row.data.salesRepName)}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Ekle
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Kayıtlar işleniyor...</p>
                    </div>
                )}

                {step === 'result' && result && (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{result.stats?.created}</div>
                                <div className="text-xs text-green-800">Yeni</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{result.stats?.updated}</div>
                                <div className="text-xs text-blue-800">Güncel</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-gray-600">{result.stats?.skipped}</div>
                                <div className="text-xs text-gray-800">Atlanan</div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{result.stats?.deleted}</div>
                                <div className="text-xs text-red-800">Silinen</div>
                            </div>
                        </div>

                        {result.errors && result.errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <h4 className="font-medium text-red-800 mb-2">Hatalar ({result.errors.length})</h4>
                                <ScrollArea className="h-[100px]">
                                    <ul className="text-sm text-red-700 list-disc list-inside">
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {step === 'preview' && (
                        <>
                            <div className="flex mr-auto">
                                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isAnalyzing}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                    Yenile
                                </Button>
                            </div>
                            <Button variant="outline" onClick={() => setStep('upload')}>
                                Geri Dön
                            </Button>
                            <Button 
                                onClick={handleProcess} 
                                disabled={analysisSummary?.errors ? analysisSummary.errors > 0 : false}
                            >
                                Onayla ve İşle
                            </Button>
                        </>
                    )}
                    {step === 'result' && (
                        <Button onClick={reset}>
                            Tamamla
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                    <DialogDescription>
                        Excel&apos;de belirtilen satış temsilcisi için kullanıcı oluşturun.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUserSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input 
                            id="name" 
                            value={newUser.name} 
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            placeholder="Ad Soyad" 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email"
                            value={newUser.email} 
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            placeholder="ornek@sirket.com" 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select 
                            value={newUser.role} 
                            onValueChange={(val) => setNewUser({...newUser, role: val})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Rol Seçin" />
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
                        <Label htmlFor="manager">Yönetici</Label>
                        <Select 
                            value={newUser.manager_id} 
                            onValueChange={(val) => setNewUser({...newUser, manager_id: val})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Yönetici Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Yok</SelectItem>
                                {managers.map((manager) => (
                                    <SelectItem key={manager.id} value={manager.id}>
                                        {manager.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>İptal</Button>
                        <Button type="submit" disabled={isCreatingUser}>
                            {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Oluştur
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    )
}
