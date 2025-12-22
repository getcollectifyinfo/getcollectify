import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSiteUrl(subdomain?: string, path = '/') {
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'getcollectify.com'
  
  const baseUrl = subdomain 
      ? `${protocol}://${subdomain}.${domain}`
      : `${protocol}://${domain}`
      
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}
