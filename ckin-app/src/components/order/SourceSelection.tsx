"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveDraft, getDraft } from "@/src/lib/order-draft";
import { Panel, primaryButton, secondaryButton } from "./ui";
import OrderSummary from "./OrderSummary";
import type { ServiceType } from "@/src/types/order";
import { List, Sparkles } from "lucide-react";

export default function SourceSelection() {
    const router = useRouter();
    const [choice, setChoice] = useState<ServiceType>("SURVEYOR_RECOMENDATION");
    const [count, setCount] = useState(1);

    useEffect(() => {
        const draft = getDraft();
        setCount(draft.kosCount ?? 1);
        if (draft.serviceType) setChoice(draft.serviceType);
    }, []);

    function next() {
        saveDraft({ serviceType: choice });
        router.push(
            choice === "SURVEYOR_RECOMENDATION"
                ? "/pesanan-baru/preferensi"
                : "/pesanan-baru/kos-pilihan",
        );
    }
    return (
        <div className="grid max-w-[1120px] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_326px]">
            <div className="space-y-4">
                {(["SURVEYOR_RECOMENDATION", "USER_CHOICE"] as ServiceType[]).map(
                    (v, i) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setChoice(v)}
                            className=" w-full text-left"
                        >
                            <Panel
                                className={`min-h-[230px] ${choice === v ? "border-[#286d62] bg-[#e8f1ed] shadow-[inset_0_0_0_1px_#286d62]" : ""}`}
                            >
                                <div className="flex justify-between">
                                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-white">
                                        {i === 0 ? (
                                            <Sparkles size={22} strokeWidth={1.8} />
                                        ) : (
                                            <List size={22} strokeWidth={1.8} />
                                        )}
                                    </span>

                                    <span>{choice === v ? "◉" : "○"}</span>
                                </div>
                                <h2 className="text-xl font-medium">
                                    {i === 0
                                        ? "Minta rekomendasi surveyor"
                                        : "Saya sudah punya pilihan kos"}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-[#7b8983]">
                                    {i === 0
                                        ? "Belum menemukan yang cocok? Ceritakan kebutuhanmu, surveyor akan mencarikan kos sesuai preferensi dan anggaran."
                                        : "Kirim nama, alamat, atau tautan kos incaranmu. Surveyor akan datang dan mengecek langsung sesuai daftar yang kamu berikan."}
                                </p>
                                <p className="mt-5 text-xs text-[#174740]">
                                    {i === 0
                                        ? "✓ Sesuai budget　 ✓ Kenal lingkungan　 ✓ Hemat waktu"
                                        : `Siapkan detail untuk ${count} kos di area tujuanmu.`}
                                </p>
                            </Panel>
                        </button>
                    ),
                )}
                <div className="rounded-lg bg-[#e8f1ed] p-4 text-xs">
                    <b>Dua cara, standar survei yang sama.</b>
                    <p className="mt-1 text-[#829088]">
                        Kedua pilihan termasuk pengecekan fasilitas, foto, video, dan
                        catatan lingkungan kos.
                    </p>
                </div>
                <button
                    className={secondaryButton}
                    onClick={() => router.push("/pesanan-baru")}
                >
                    ← Kembali
                </button>
            </div>
            <div>
                <OrderSummary showSource={false} />
                <button onClick={next} className={`${primaryButton} mt-3 w-full`}>
                    Lanjutkan →
                </button>
            </div>
        </div>
    );
}
