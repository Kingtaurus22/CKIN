"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDraft, makeOrderPayload, clearDraft } from "@/src/lib/order-draft";
import type { OrderDraft } from "@/src/types/order";
import { formatRupiah, getTotal } from "@/src/types/order";
import { Panel, primaryButton, secondaryButton } from "./ui";

export default function ReviewOrder() {
    const router = useRouter();

    const [draft, setDraft] = useState<Partial<OrderDraft>>({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => setDraft(getDraft()), []);

    const d = draft as OrderDraft;
    const user = d.serviceType === "USER_CHOICE";

    async function create() {
        if (!d.surveyLocation || !d.serviceType || !d.surveyDate) {
            setError("Data pesanan belum lengkap. Silakan ulangi proses pemesanan.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            // console.log(makeOrderPayload(d))
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(makeOrderPayload(d)),
            });

            const json = await res.json();

            if (!res.ok) throw new Error(json.message ?? "Gagal membuat pesanan");

            clearDraft()
            sessionStorage.setItem("ckin-current-order-id", json.data._id);
            router.push(`/pembayaran?orderId=${json.data._id}`);
            // router.push(`/pembayaran/${json.data._id}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Terjadi kesalahan");
            setBusy(false);
        }
    }
    if (!draft.serviceType)
        return <p className="text-sm text-[#829088]">Memuat detail pesanan...</p>;
    return (
        <div className="grid max-w-[1180px] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_326px]">
            <div className="space-y-4">
                <div className="rounded-lg bg-[#fff3dc] p-4 text-xs">
                    <b>Periksa detail pesanan sebelum melanjutkan.</b>
                    <p className="mt-1 text-[#829088]">
                        Pesanan akan dibuat dengan status menunggu pembayaran.
                    </p>
                </div>
                <Panel>
                    <h2 className="font-medium">Detail survei</h2>
                    <div className="mt-5 grid gap-4 text-xs sm:grid-cols-2">
                        <p>
                            <span className="text-[#829088]">Lokasi</span>
                            <br />
                            {d.surveyLocation.district}, {d.surveyLocation.city},{" "}
                            {d.surveyLocation.province}
                        </p>
                        <p>
                            <span className="text-[#829088]">Sumber kos</span>
                            <br />
                            {user ? "Pilihan sendiri" : "Rekomendasi surveyor"}
                        </p>
                        <p>
                            <span className="text-[#829088]">Jumlah kos</span>
                            <br />
                            {d.kosCount} kos
                        </p>
                        <p>
                            <span className="text-[#829088]">Tanggal survei</span>
                            <br />
                            {d.surveyDate}
                        </p>
                        <p>
                            <span className="text-[#829088]">Tanggal masuk kos</span>
                            <br />
                            {d.moveInDate}
                        </p>
                    </div>
                </Panel>
                {user ? (
                    <Panel>
                        <h2 className="font-medium">Detail kos pilihanmu</h2>
                        <div className="mt-4 space-y-3">
                            {(d.targets ?? []).map((t, i) => (
                                <div key={i} className="rounded-lg bg-[#f5f7f3] p-4">
                                    <b className="text-sm">
                                        {i + 1}. {t.propertyName}
                                    </b>
                                    <p className="mt-2 text-xs text-[#65766e]">{t.address}</p>
                                    {t.googleMapsUrls && (
                                        <a
                                            href={t.googleMapsUrls}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 block text-xs text-[#286d62]"
                                        >
                                            Google Maps ↗
                                        </a>
                                    )}
                                    {t.ownerContact && (
                                        <p className="mt-1 text-xs text-[#829088]">
                                            Kontak: {t.ownerContact}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <h2 className="font-medium">Notes</h2>
                            <p className="mt-4 rounded-lg bg-[#f5f7f3] p-3 text-xs">
                                {d.requirements?.notes}
                            </p>
                        </div>
                    </Panel>
                ) : (
                    <Panel>
                        <h2 className="font-medium">Preferensi kos</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[
                                d.requirements.genderPreferences === "FEMALE"
                                    ? "Kos putri"
                                    : d.requirements.genderPreferences === "MALE"
                                        ? "Kos putra"
                                        : "Kos campur",
                                `${formatRupiah(d.requirements.budget?.min ?? 0)}–${formatRupiah(d.requirements.budget?.max ?? 0)} / bulan`,
                            ].map((x) => (
                                <span
                                    key={x}
                                    className="rounded-full bg-[#e8f1ed] px-3 py-1.5 text-[10px] text-[#286d62]"
                                >
                                    {x}
                                </span>
                            ))}
                        </div>
                        <div>
                            <p className="mt-4 text-xs text-[#829088]">{(d.requirements.facilities?.join(` · `))}</p>
                        </div>
                        <div className="mt-4">
                            <h2 className="font-medium">Notes</h2>
                            <p className="mt-4 rounded-lg bg-[#f5f7f3] p-3 text-xs">
                                {d.requirements?.notes}
                            </p>
                        </div>
                    </Panel>
                )}
                <button className={secondaryButton} onClick={() => router.back()}>
                    ← Kembali
                </button>
                {error && (
                    <p role="alert" className="text-xs text-red-600">
                        {error}
                    </p>
                )}
            </div>
            <Panel className="h-fit">
                <h2 className="font-medium">Rincian pembayaran</h2>
                <div className="my-4 space-y-3 text-xs">
                    <div className="flex justify-between">
                        <span className="text-[#829088]">Survei {d.kosCount} kos</span>
                        <span>{formatRupiah(d.kosCount * 75000)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#829088]">Biaya layanan</span>
                        <span>{formatRupiah(5000)}</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between font-semibold">
                        <b>Total</b>
                        <b className="text-xl">{formatRupiah(getTotal(d.kosCount))}</b>
                    </div>
                </div>
                <button
                    disabled={busy}
                    onClick={create}
                    className={`${primaryButton} w-full`}
                >
                    {busy ? "Membuat pesanan..." : "Buat pesanan & lanjut bayar →"}
                </button>
            </Panel>
        </div>
    );
}
