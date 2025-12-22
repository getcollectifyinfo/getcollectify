import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";
  const rootDomain = process.env.ROOT_DOMAIN || "getcollectify.com";

  // Check if we are on the root domain (Landing Page)
  // 1. Exact match (e.g. "getcollectify.com" or "localhost:3000")
  // 2. www subdomain (e.g. "www.getcollectify.com")
  // 3. Vercel preview URLs (ending in .vercel.app) - typically treat as root
  const isRoot = 
    host === rootDomain || 
    host === `www.${rootDomain}` || 
    host.endsWith(".vercel.app");

  if (isRoot) {
    return NextResponse.next();
  }

  // Extract subdomain
  // e.g. "demo.getcollectify.com" -> "demo"
  // e.g. "demo.localhost:3000" -> "demo" (if rootDomain is "localhost:3000")
  const subdomain = host.endsWith(`.${rootDomain}`)
    ? host.replace(`.${rootDomain}`, "")
    : host; // Fallback for custom domains if supported later

  const searchParams = url.searchParams.toString();
  const path = `${url.pathname}${searchParams ? `?${searchParams}` : ""}`;

  // Rewrite subdomain traffic to /[domain]/... routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", url.pathname);

  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url), {
    request: {
      headers: requestHeaders,
    },
  });
}