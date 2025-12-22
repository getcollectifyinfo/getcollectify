import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;

  const rootDomain = process.env.ROOT_DOMAIN!;
  const vercelSuffix = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX;

  let hostname = req.headers.get("host") || "";

  // local dev normalization
  hostname = hostname.replace(".localhost:3000", `.${rootDomain}`);

  // Vercel preview normalization: foo---bar.vercel.app -> foo.rootDomain
  if (vercelSuffix && hostname.includes("---") && hostname.endsWith(`.${vercelSuffix}`)) {
    hostname = `${hostname.split("---")[0]}.${rootDomain}`;
  }

  const searchParams = url.searchParams.toString();
  const path = `${url.pathname}${searchParams ? `?${searchParams}` : ""}`;

  // root domains (marketing)
  if (
    hostname === "localhost:3000" ||
    hostname === rootDomain ||
    hostname === `www.${rootDomain}`
  ) {
    return NextResponse.next();
  }

  // subdomain -> /[domain]/... routes
  const subdomain = hostname.endsWith(`.${rootDomain}`)
    ? hostname.replace(`.${rootDomain}`, "")
    : hostname;

  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
}