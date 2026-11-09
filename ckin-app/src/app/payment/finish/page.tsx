import Link from "next/link";

export const instant = false

export default async function PaymentFinishPage({
    searchParams,
}: {
    searchParams: Promise<{ order_id?: string; transaction_status?: string }>;
}) {
    const params = await searchParams;
    const status = params.transaction_status ?? "pending";
    const paid = status === "settlement" || status === "capture";

    return (
        <main className="grid min-h-screen place-items-center bg-[#f5f7f3] px-4 py-10 text-[#203b38]">
            <section className="w-full max-w-lg rounded-xl border border-[#e0e7df] bg-white p-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e8f1ed] text-2xl text-[#174740]">
                    {paid ? "✓" : "◷"}
                </div>
                <h1 className="mt-5 text-2xl font-medium">
                    {paid ? "Pembayaran diterima" : "Status pembayaran sedang diproses"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#829088]">
                    {paid
                        ? "Terima kasih. Pembayaranmu sudah berhasil diterima."
                        : "Midtrans sedang memproses pembayaran. Status pesanan akan diperbarui setelah notifikasi pembayaran diterima."}
                </p>
                {params.order_id && (
                    <p className="mt-4 text-xs text-[#829088]">
                        Referensi transaksi: {params.order_id}
                    </p>
                )}
                <Link
                    href="/pesanan-baru"
                    className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-[#123f3a] px-5 text-xs font-semibold text-white"
                >
                    Kembali ke CKIN
                </Link>
            </section>
        </main>
    );
}
