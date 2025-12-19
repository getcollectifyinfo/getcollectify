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

export default async function middleware(req: NextRequest) {
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
        return NextResponse.next()
    }

    // special case for demo.getcollectify.com
    //   if (hostname === `demo.${process.env.ROOT_DOMAIN}`) {
    //     return NextResponse.rewrite(
    //       new URL(`/demo${path === '/' ? '' : path}`, req.url)
    //     )
    //   }

    // rewrite everything else to `/[domain]/... dynamic route
    const subdomain = hostname.split('.')[0]
    return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url))
}
