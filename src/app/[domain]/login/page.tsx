import DemoLogin from '@/components/demo-login'
import LoginForm from '@/components/login-form'

export default async function LoginPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const isDemo = domain.startsWith('demo')

    return (
        <div className="flex min-h-screen items-center justify-center py-12 px-4">
            {isDemo ? <DemoLogin /> : <LoginForm />}
        </div>
    )
}