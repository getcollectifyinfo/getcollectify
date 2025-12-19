
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketingPage() {
  return (
    <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
      <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
          Tahsilet by Collectify
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Accelerate collections, involving Sales in the process. Full visibility for Accounting and Managers.
        </p>
        <div className="space-x-4">
          <Link href="/login">
            <Button size="lg">Ücretsiz Deneyin</Button>
          </Link>
          <Link href="https://demo.getcollectify.com" target="_blank">
            <Button variant="outline" size="lg">Demo'yu Aç</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
