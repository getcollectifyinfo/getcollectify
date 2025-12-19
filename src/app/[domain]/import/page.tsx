import { createClient } from '@/lib/supabase/server'
import ImportForm from './import-form'

export default async function ImportPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const supabase = await createClient()

    // check if user has access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Oturum açın</div>

    // Fetch previous jobs
    const { data: jobs } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Veri İçe Aktar</h1>
            <p className="text-muted-foreground">
                Excel veya CSV dosyası ile müşteri ve borç verilerini toplu olarak yükleyin.
            </p>

            <ImportForm jobs={jobs || []} />
        </div>
    )
}
