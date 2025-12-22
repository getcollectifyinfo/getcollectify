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
    
    // Get hostname (e.g. vercel.com, test.vercel.app, etc.)
    let hostname = req.headers
        .get("host")!
        .replace(".localhost:3000", `.${process.env.ROOT_DOMAIN}`);

    // Special case for Vercel preview URLs
    if (
        hostname.includes("---") &&
        hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
    ) {
        hostname = `${hostname.split("---")[0]}.${process.env.ROOT_DOMAIN}`;
    }

    const searchParams = req.nextUrl.searchParams.toString();
    // Get the pathname of the request (e.g. /, /about, /blog/first-post)
    const path = `${url.pathname}${
        searchParams.length > 0 ? `?${searchParams}` : ""
    }`;

    // rewrites for app pages
    if (hostname === `demo.${process.env.ROOT_DOMAIN}`) {
        return NextResponse.rewrite(
            new URL(`/demo${path === "/" ? "" : path}`, req.url)
        );
    }

    // special case for root domain
    if (
        hostname === "localhost:3000" ||
        hostname === process.env.ROOT_DOMAIN
    ) {
        return NextResponse.next();
    }
    
    // rewrite everything else to `/[domain]/[slug] dynamic route
    return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
}
