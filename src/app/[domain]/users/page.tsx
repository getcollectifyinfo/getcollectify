import { getUsers } from '@/app/actions/get-users'
import UsersClient from './users-client'

export default async function UsersPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const isDemo = domain.startsWith('demo')

    const { users, error } = await getUsers()

    if (error) {
        console.error('Page Load Error:', error)
    }

    // Transform data to match client interface if necessary, 
    // but Supabase response usually matches closely.
    // We might need to cast or ensure types.
    // @ts-ignore
    const safeUsers = users?.map(u => ({
        ...u,
        // Ensure manager is in correct format if it comes as array
        manager: Array.isArray(u.manager) ? u.manager[0] : u.manager
    })) || []

    return (
        <UsersClient 
            initialUsers={safeUsers} 
            isDemo={isDemo} 
        />
    )
}
