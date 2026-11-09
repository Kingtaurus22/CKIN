"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Panel, primaryButton } from "./ui";
import { formatRupiah, getTotal } from "@/src/types/order";

const methods = [
    ["saldo", "Saldo CKIN"],
    ["bank", "Transfer bank / Virtual Account"],
    ["qris", "QRIS"],
    ["ewallet", "E-wallet"],
];
export default function PaymentClient() {
    const params = useSearchParams();

    const [method, setMethod] = useState("saldo");
    const [accepted, setAccepted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [orderId, setOrderId] = useState<string | null>(params.get("orderId"));
    const [count, setCount] = useState(1);

    useEffect(() => {
        setOrderId(
            params.get("orderId") ?? sessionStorage.getItem("ckin-current-order-id"),
        );
        const raw = sessionStorage.getItem("ckin-order-draft");
        if (raw) {
            try {
                setCount(JSON.parse(raw).kosCount ?? 3);
            } catch { }
        }
    }, [params]);

    async function pay() {
        if (!orderId) {
            setError("ID pesanan tidak ditemukan.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? "Gagal membuat pembayaran");
            if (json.data?.redirectUrl) window.location.href = json.data.redirectUrl;
            else throw new Error("URL pembayaran tidak tersedia.");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Terjadi kesalahan");
            setBusy(false);
        }
    }

    return (
        <div className="grid max-w-[1120px] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
                <Panel>
                    <h2 className="font-medium">Pilih metode pembayaran</h2>
                    <p className="mt-1 text-xs text-[#829088]">
                        Pilih salah satu metode pembayaran.
                    </p>
                    <div className="mt-5 space-y-3">
                        {methods.map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() => setMethod(id)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left ${method === id ? "border-[#286d62] bg-[#e8f1ed]" : "border-[#dfe7de]"}`}
                            >
                                <span className="text-lg text-[#286d62]">
                                    {id === "saldo"
                                        ? "▣"
                                        : id === "bank"
                                            ? "⌂"
                                            : id === "qris"
                                                ? "▦"
                                                : "▯"}
                                </span>
                                <span className="flex-1 text-sm font-medium">
                                    {label}
                                    <small className="mt-1 block text-[10px] text-[#829088]">
                                        {id === "saldo"
                                            ? "Saldo tersedia"
                                            : id === "bank"
                                                ? "BCA, BNI, BRI, Mandiri"
                                                : id === "qris"
                                                    ? "Scan dari aplikasi bank atau e-wallet"
                                                    : "GoPay, OVO, DANA, ShopeePay"}
                                    </small>
                                </span>
                                <span>{method === id ? "◉" : "○"}</span>
                            </button>
                        ))}
                    </div>
                </Panel>
                <Panel>
                    <b className="text-sm">Dana aman, proses transparan.</b>
                    <p className="mt-1 text-xs text-[#829088]">
                        Pembayaran diproses melalui Midtrans dan dicatat otomatis.
                    </p>
                </Panel>
            </div>
            <Panel>
                <h2 className="font-medium">Ringkasan pembayaran</h2>
                <div className="my-4 border-b pb-4 text-xs">
                    <b>Pesanan #{orderId?.slice(-8) ?? "—"}</b>
                    <p className="mt-1 text-[#829088]">{count} kos</p>
                </div>
                <p className="text-xs text-[#829088]">Total pembayaran</p>
                <b className="mt-1 block text-3xl text-[#123f3a]">
                    {formatRupiah(getTotal(count))}
                </b>
                <p className="mt-3 text-xs">
                    Metode: {methods.find((x) => x[0] === method)?.[1]}
                </p>
                <label className="mt-5 flex gap-2 text-xs">
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                    />
                    Saya menyetujui ketentuan pembayaran.
                </label>
                {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
                <button
                    disabled={!accepted || busy}
                    onClick={pay}
                    className={`${primaryButton} mt-5 w-full`}
                >
                    {busy
                        ? "Menghubungkan ke Midtrans..."
                        : `Bayar ${formatRupiah(getTotal(count))}`}
                </button>
                <p className="mt-4 text-center text-[10px] text-[#829088]">
                    Kamu akan diarahkan ke halaman pembayaran Midtrans.
                </p>
            </Panel>
        </div>
    );
}
