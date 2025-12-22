import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host");

  console.log("MW DEBUG:", {
    originalHost: hostname,
    rootDomain: process.env.ROOT_DOMAIN,
    path: url.pathname,
  });

  const currentHost = hostname!.replace(".localhost:3000", `.${process.env.ROOT_DOMAIN}`);

  // Root domain check
  if (
    currentHost === "localhost:3000" ||
    currentHost === process.env.ROOT_DOMAIN ||
    currentHost === `www.${process.env.ROOT_DOMAIN}`
  ) {
    return NextResponse.next();
  }

  // Subdomain extraction
  const subdomain = currentHost.split(".")[0];
  
  // Rewrite to dynamic route
  const searchParams = url.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;
  
  console.log("MW REWRITE:", {
    subdomain,
    target: `/${subdomain}${path}`
  });

  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
}