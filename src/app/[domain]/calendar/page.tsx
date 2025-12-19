import { createClient } from '@/lib/supabase/server'
import { CalendarView } from './calendar-view'

export default async function CalendarPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const supabase = await createClient()

    // Fetch promises
    const { data: promises } = await supabase
        .from('promises')
        .select(`
            *,
            customers (
                id,
                name
            )
        `)
        .order('promise_date')

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Takvim</h1>
            </div>

            <CalendarView promises={promises || []} />
        </div>
    )
}
