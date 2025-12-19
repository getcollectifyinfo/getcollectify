import { NextRequest, NextResponse } from 'next/server'

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
    ],
}

export default async function proxy(req: NextRequest) {
    const url = req.nextUrl

    // Get hostname of request (e.g. demo.getcollectify.com, demo.localhost:3000)
    const hostname = req.headers
        .get('host')!
        .replace('.localhost:3000', `.${process.env.ROOT_DOMAIN}`)

    // Search params, etc.
    const searchParams = req.nextUrl.searchParams.toString()
    // Get the pathname of the request (e.g. /, /about, /blog/first-post)
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''
        }`

    // rewrites for app pages
    // if hostname is the root domain (getcollectify.com)
    if (
        hostname === 'getcollectify.com' ||
        hostname === 'www.getcollectify.com' ||
        hostname === process.env.ROOT_DOMAIN
    ) {
        // If it's the root domain and the path is empty, rewrite to / (marketing)
        // Actually, we want to map root domain to (marketing) folder if we use that structure.
        // But usually we just handle it in app/page.tsx or similar.
        // However, for multi-tenant, it's cleaner to rewrite to a dedicated folder.
        // special case for localhost to allow marketing page local dev
        if (
            hostname === 'localhost:3000' ||
            hostname === 'www.getcollectify.com' ||
            hostname === 'getcollectify.com' ||
            hostname === process.env.ROOT_DOMAIN
        ) {
            return NextResponse.next()
        }

        // rewrite everything else to `/[domain]/... dynamic route
        const searchParams = req.nextUrl.searchParams.toString()
        const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`

        // For localhost subdomains (e.g. foo.localhost:3000)
        let subdomain = hostname.split('.')[0]

        // Safety check: if hostname is localhost:3000 but logic fell through (unlikely with above check),
        // ensure we don't treat 'localhost:3000' as subdomain
        if (subdomain === 'localhost:3000' || subdomain === 'localhost') {
            return NextResponse.next()
        }

        return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url))
    }
