"use client";
import { useEffect, useState } from "react";
import { getDraft } from "@/src/lib/order-draft";
import { formatRupiah, getTotal, PRICE_PER_KOS } from "@/src/types/order";
import type { OrderDraft } from "@/src/types/order";
import { Panel } from "./ui";
export default function OrderSummary({
    showSource = true,
}: {
    showSource?: boolean;
}) {
    const [d, setD] = useState<Partial<OrderDraft>>({});
    useEffect(() => setD(getDraft()), []);
    const count = d.kosCount ?? 3;
    return (
        <Panel className="h-fit">
            <h2 className="font-medium">Ringkasan pesanan</h2>
            <div className="mt-4 border-b border-[#e2e8e1] pb-4">
                <b className="text-sm">
                    {d.surveyLocation
                        ? `${d.surveyLocation.district}, ${d.surveyLocation.city}`
                        : "Lokasi survei"}
                </b>
                <p className="mt-1 text-[10px] text-[#829088]">
                    {d.surveyLocation?.province}
                </p>
            </div>
            <div className="space-y-3 py-4 text-xs">
                <div className="flex justify-between">
                    <span className="text-[#829088]">Jumlah kos</span>
                    <span>{count} kos</span>
                </div>
                {showSource && (
                    <div className="flex justify-between gap-2">
                        <span className="text-[#829088]">Sumber kos</span>
                        <span>
                            {d.serviceType === "USER_CHOICE"
                                ? "Pilihan sendiri"
                                : "Rekomendasi surveyor"}
                        </span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-[#829088]">Biaya per kos</span>
                    <span>{formatRupiah(PRICE_PER_KOS)}</span>
                </div>
            </div>
            <div className="space-y-3 border-t border-[#e2e8e1] py-4 text-xs">
                <div className="flex justify-between">
                    <span className="text-[#829088]">Biaya survei</span>
                    <span>{formatRupiah(count * PRICE_PER_KOS)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#829088]">Biaya layanan</span>
                    <span>{formatRupiah(5000)}</span>
                </div>
                <div className="flex justify-between pt-1 font-semibold">
                    <span>Total pembayaran</span>
                    <b className="text-xl text-[#123f3a]">
                        {formatRupiah(getTotal(count))}
                    </b>
                </div>
            </div>
        </Panel>
    );
}
