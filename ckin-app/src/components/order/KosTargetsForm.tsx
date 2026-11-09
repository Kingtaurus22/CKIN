"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDraft, saveDraft } from "@/src/lib/order-draft";
import type { OrderTarget } from "@/src/types/order";
import { Panel, Field, inputClass, primaryButton, secondaryButton } from "./ui";
import OrderSummary from "./OrderSummary";

const empty = (): OrderTarget => ({
    propertyName: "",
    address: "",
    googleMapsUrls: "",
    ownerContact: "",
});

export default function KosTargetsForm() {
    const router = useRouter();
    const [count, setCount] = useState(3);
    const [targets, setTargets] = useState<OrderTarget[]>(() =>
        Array.from({ length: 3 }, empty),
    );
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const d = getDraft();
        const n = d.kosCount ?? 3;
        setCount(n);
        setTargets(Array.from({ length: n }, (_, i) => d.targets?.[i] ?? empty()));
        setNotes(d.requirements?.notes ?? "");
    }, []);

    function patch(i: number, key: keyof OrderTarget, value: string) {
        setTargets((a) => a.map((t, j) => (i === j ? { ...t, [key]: value } : t)));
    }

    function next() {
        if (targets.some((t) => !t.propertyName.trim() || !t.address.trim())) {
            setError("Nama dan alamat wajib diisi untuk setiap kos.");
            return;
        }
        saveDraft({ serviceType: "USER_CHOICE", targets, requirements: { notes } });
        router.push("/pesanan-baru/jadwal");
    }

    return (
        <div className="grid max-w-[1120px] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_326px]">
            <div className="space-y-4">
                <div className="rounded-lg bg-[#e8f1ed] p-4 text-xs">
                    <b>
                        {targets.length} dari {count} kos disiapkan
                    </b>
                    <p className="mt-1 text-[#829088]">
                        Nama dan alamat wajib diisi. Tautan serta kontak pemilik opsional.
                    </p>
                </div>
                {error && (
                    <p role="alert" className="text-xs text-red-600">
                        {error}
                    </p>
                )}
                {targets.map((t, i) => (
                    <Panel key={i}>
                        <h2 className="mb-5 text-sm font-medium">
                            {String(i + 1).padStart(2, "0")}　Detail kos
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Nama kos *">
                                <input
                                    className={inputClass}
                                    value={t.propertyName}
                                    onChange={(e) => patch(i, "propertyName", e.target.value)}
                                    placeholder="Nama properti"
                                />
                            </Field>
                            <Field label="Kontak pemilik (opsional)">
                                <input
                                    className={inputClass}
                                    value={t.ownerContact ?? ""}
                                    onChange={(e) => patch(i, "ownerContact", e.target.value)}
                                    placeholder="Nomor telepon"
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="Alamat lengkap *">
                                <input
                                    className={inputClass}
                                    value={t.address}
                                    onChange={(e) => patch(i, "address", e.target.value)}
                                    placeholder="Alamat lengkap kos"
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="Tautan kos / Google Maps">
                                <input
                                    className={inputClass}
                                    value={t.googleMapsUrls ?? ""}
                                    onChange={(e) => patch(i, "googleMapsUrls", e.target.value)}
                                    placeholder="https://maps.google.com/..."
                                />
                            </Field>
                        </div>
                    </Panel>
                ))}
                <Panel>
                    <Field label="Catatan tambahan">
                        <textarea
                            className="w-full rounded-lg border border-[#dce5dc] p-3 text-sm"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Hal yang perlu dicek secara khusus"
                        />
                    </Field>
                </Panel>

                <button
                    className={secondaryButton}
                    onClick={() => router.push("/pesanan-baru/sumber-kos")}
                >
                    ← Kembali ke pilihan kos
                </button>
            </div>
            <div>
                <OrderSummary />
                <button className={`${primaryButton} mt-3 w-full`} onClick={next}>
                    Lanjut pilih jadwal →
                </button>
            </div>
        </div>
    );
}
