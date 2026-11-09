"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDraft, saveDraft } from "@/src/lib/order-draft";
import { Panel, Field, inputClass, primaryButton, secondaryButton } from "./ui";
import OrderSummary from "./OrderSummary";
import { formatRupiah } from "@/src/types/order";
const groups = [
    ["Kamar mandi dalam", "AC", "Wi-Fi", "Tempat tidur & lemari"],
    ["Parkir motor", "Dapur bersama", "Laundry", "Akses 24 jam"],
    [
        "Jendela / ventilasi",
        "Listrik termasuk",
        "Keamanan / CCTV",
        "Boleh hewan peliharaan",
    ],
];
export default function PreferenceForm() {
    const router = useRouter();
    const [gender, setGender] = useState<"ANY" | "MALE" | "FEMALE">("FEMALE");
    const [min, setMin] = useState("1000000");
    const [max, setMax] = useState("1800000");
    const [facilities, setFacilities] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    useEffect(() => {
        const old = getDraft();
        if (old.requirements) {
            setGender(old.requirements.genderPreferences ?? "FEMALE");
            setMin(String(old.requirements.budget?.min ?? 1000000));
            setMax(String(old.requirements.budget?.max ?? 1800000));
            setFacilities(old.requirements.facilities ?? []);
            setNotes(old.requirements.notes ?? "");
        }
    }, []);
    function next() {
        if (Number(min) < 0 || Number(max) < Number(min))
            return alert("Periksa rentang budget.");
        saveDraft({
            serviceType: "SURVEYOR_RECOMENDATION",
            requirements: {
                genderPreferences: gender,
                budget: { min: Number(min), max: Number(max) },
                facilities,
                notes,
            },
        });
        router.push("/pesanan-baru/jadwal");
    }
    return (
        <div className="grid max-w-[1120px] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_326px]">
            <div className="space-y-4">
                <Panel>
                    <h2 className="font-medium">Kebutuhan utama</h2>
                    <p className="mt-1 text-xs text-[#829088]">
                        Preferensi ini menjadi panduan surveyor saat mencari kos.
                    </p>
                    <p className="mb-2 mt-5 text-xs font-medium">Tipe kos</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {[
                            { v: "FEMALE", l: "Kos putri" },
                            { v: "MALE", l: "Kos putra" },
                            { v: "ANY", l: "Kos campur" },
                        ].map((x) => (
                            <button
                                key={x.v}
                                onClick={() => setGender(x.v as typeof gender)}
                                className={`rounded-lg border p-3 text-xs ${gender === x.v ? "border-[#286d62] bg-[#e8f1ed]" : "border-[#dfe7de]"}`}
                            >
                                {gender === x.v ? "◉" : "○"}　{x.l}
                            </button>
                        ))}
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Field label="Budget minimum / bulan">
                            <input
                                type="number"
                                className={inputClass}
                                value={min}
                                onChange={(e) => setMin(e.target.value)}
                            />
                        </Field>
                        <Field label="Budget maksimum / bulan">
                            <input
                                type="number"
                                className={inputClass}
                                value={max}
                                onChange={(e) => setMax(e.target.value)}
                            />
                        </Field>
                    </div>
                    <p className="mt-2 text-[10px] text-[#829088]">
                        Contoh: {formatRupiah(Number(min) || 0)} – {formatRupiah(Number(max) || 0)}{" "}
                        per bulan
                    </p>
                </Panel>
                <Panel>
                    <h2 className="font-medium">Fasilitas yang diinginkan</h2>
                    <p className="mt-1 text-xs text-[#829088]">
                        Pilih yang paling penting.
                    </p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        {groups.map((g, i) => (
                            <div key={i} className="space-y-4">
                                {g.map((f) => (
                                    <label key={f} className="flex items-center gap-2 text-xs">
                                        <input
                                            type="checkbox"
                                            className="accent-[#174740]"
                                            checked={facilities.includes(f)}
                                            onChange={() =>
                                                setFacilities((a) =>
                                                    a.includes(f) ? a.filter((x) => x !== f) : [...a, f],
                                                )
                                            }
                                        />
                                        {f}
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel>
                    <Field label="Catatan tambahan">
                        <textarea
                            className="w-full rounded-lg border border-[#dce5dc] p-3 text-sm"
                            rows={4}
                            maxLength={500}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ada kebutuhan khusus?"
                        />
                        <span className="mt-2 block text-[10px] text-[#829088]">
                            {notes.length}/500 karakter
                        </span>
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
