export default async function DashboardPage({ params }: { params: Promise<{ domain: string }> }) {
    const { domain } = await params

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-bold md:text-2xl">Dashboard - {domain}</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="text-sm font-medium">Toplam Açık Alacak</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">₺200.000,00</div>
                        <p className="text-xs text-muted-foreground">+20.1% geçen aydan (Demo)</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="text-sm font-medium">Gecikmiş</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">₺12.000,00</div>
                        <p className="text-xs text-muted-foreground">Demo Verisi</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="text-sm font-medium">Takip Oranı</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">%45</div>
                        <p className="text-xs text-muted-foreground">Demo Verisi</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="text-sm font-medium">Aranmayanlar</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">4</div>
                        <p className="text-xs text-muted-foreground">14+ gündür not yok</p>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Dashboard İçeriği</h2>
                <p className="text-muted-foreground">
                    Dashboard içeriği yakında tasarlanacak. Alacak listesi için &quot;Alacaklar&quot; menüsünü kullanın.
                </p>
            </div>
        </div>
    )
}
