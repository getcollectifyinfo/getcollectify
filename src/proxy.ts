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

    // 1. Root Domain / Localhost check
    // If it's the main domain, serve the proper page (marketing or root app)
    // using NextResponse.next() to pass through.
    if (
        hostname === 'localhost:3000' ||
        hostname === 'www.getcollectify.com' ||
        hostname === 'getcollectify.com' ||
        hostname === process.env.ROOT_DOMAIN
    ) {
        return NextResponse.next()
    }

    // 2. Subdomain Rewrite
    // Rewrite everything else to `/[domain]/...` dynamic route
    const searchParams = req.nextUrl.searchParams.toString()
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`

    // For localhost subdomains (e.g. foo.localhost:3000)
    let subdomain = hostname.split('.')[0]

    // Safety check: if code reaches here with 'localhost:3000' (should be caught above),
    // ensure we don't treat it as a subdomain.
    if (subdomain === 'localhost:3000' || subdomain === 'localhost') {
        return NextResponse.next()
    }

    return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url))
}
