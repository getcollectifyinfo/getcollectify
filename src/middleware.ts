import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;

  const rootDomain = process.env.ROOT_DOMAIN || "getcollectify.com";
  const hostHeader = req.headers.get("host") || "";

  // local check
  const isLocalhost = hostHeader.includes("localhost");

  // normalize hostname (remove port)
  const hostname = hostHeader.replace(":3000", "");

  const searchParams = url.searchParams.toString();
  const path = `${url.pathname}${searchParams ? `?${searchParams}` : ""}`;

  // Root / marketing (apex + www + localhost)
  if (
    isLocalhost ||
    hostname === rootDomain ||
    hostname === `www.${rootDomain}`
  ) {
    return NextResponse.next();
  }

  // tenant = first label (subdomain)
  const subdomain = hostname.endsWith(`.${rootDomain}`)
    ? hostname.replace(`.${rootDomain}`, "")
    : hostname;

  // Rewrite subdomain traffic to /[domain]/... routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", url.pathname);

  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url), {
    request: {
      headers: requestHeaders,
    },
  });
}