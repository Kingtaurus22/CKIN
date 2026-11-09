"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDraft, saveDraft } from "@/src/lib/order-draft";
import { Panel, Field, inputClass, primaryButton, secondaryButton } from "./ui";
import OrderSummary from "./OrderSummary";

// const slots = ["09.00 – 12.00 WIB", "13.00 – 16.00 WIB", "16.00 – 18.00 WIB"];

// const datePlus = (n: number) => {
//     const d = new Date();
//     d.setDate(d.getDate() + n);
//     return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// };

export default function ScheduleForm() {
    const router = useRouter();

    const [moveInDate, setMoveInDate] = useState("");
    const [surveyDate, setSurveyDate] = useState("");
    // const [time, setTime] = useState(slots[0]);
    const [minMoveInDate, setMinMoveInDate] = useState("");
    const [minSurveyDate, setMinSurveyDate] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const old = getDraft();
        const today = new Date()
        const minMoveIn = new Date()

        today.setDate(today.getDate() + 2)
        const minimumDate = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0"),
        ].join("-");

        minMoveIn.setDate(minMoveIn.getDate() + 9)
        const minimumMoveInDate = [
            minMoveIn.getFullYear(),
            String(minMoveIn.getMonth() + 1).padStart(2, "0"),
            String(minMoveIn.getDate()).padStart(2, "0"),
        ].join("-");

        setMinSurveyDate(minimumDate);
        setSurveyDate(old.surveyDate || minimumDate);

        setMinMoveInDate(minimumMoveInDate);
        setMoveInDate(old.moveInDate || minimumMoveInDate);
        // if (old.surveyTime) setTime(old.surveyTime);
    }, []);

    // const latest = new Date(
    //     new Date(moveIn + "T12:00:00").getTime() - 7 * 86400000,
    // );

    // const latest = new Date(datePlus(3))

    // const max = `${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, "0")}-${String(latest.getDate()).padStart(2, "0")}`;

    function next() {
        // Validate date initialization
        if (!minSurveyDate || !minMoveInDate) {
            setError("Tanggal belum siap. Silakan coba lagi.");
            return;
        }

        // Validate move-in date
        if (!moveInDate || moveInDate < minMoveInDate) {
            setError("Tanggal masuk kos minimal 7 hari dari sekarang.");
            return;
        }

        // Validate survey date
        if (!surveyDate) {
            setError("Silakan pilih tanggal survei.");
            return;
        }

        // Survey must be at least 3 days from today
        if (surveyDate < minSurveyDate) {
            setError("Tanggal survei minimal 2 hari dari sekarang.");
            return;
        }

        // Survey must be at least 7 days before move-in
        const latestSurvey = new Date(`${moveInDate}T12:00:00`);
        latestSurvey.setDate(latestSurvey.getDate() - 7);

        const maxSurveyDate = [
            latestSurvey.getFullYear(),
            String(latestSurvey.getMonth() + 1).padStart(2, "0"),
            String(latestSurvey.getDate()).padStart(2, "0"),
        ].join("-");

        if (surveyDate > maxSurveyDate) {
            setError(
                "Tanggal survei harus minimal 7 hari sebelum tanggal masuk kos.",
            );
            return;
        }

        // All validations passed
        setError("");

        saveDraft({
            moveInDate,
            surveyDate,
        });

        router.push("/pesanan/menunggu-pembayaran");
    }

    return (
        <div className="grid max-w-[1120px] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_326px]">
            <div className="space-y-4">
                {error && (
                    <p role="alert" className="mb-4 text-xs text-red-600">
                        {error}
                    </p>
                )}
                <Panel>
                    <h2 className="font-medium">Kapan rencana masuk kos?</h2>
                    <div className="mt-5">
                        <Field label="Tanggal rencana masuk">
                            <input
                                type="date"
                                className={inputClass}
                                value={moveInDate}
                                min={minMoveInDate}
                                onChange={(e) => setMoveInDate(e.target.value)}
                            />
                        </Field>
                    </div>
                    <div className="mt-4 rounded-lg bg-[#e8f1ed] p-4 text-xs">
                        <b>
                            Minimal tanggal masuk:{" "}
                            {minMoveInDate
                                ? new Date(`${minMoveInDate}T12:00:00`).toLocaleDateString(
                                    "id-ID",
                                    {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    },
                                )
                                : "Memuat tanggal..."}
                        </b>
                        <p className="mt-1 text-[#829088]">
                            Kami memberi jeda setidaknya 7 hari untuk membaca laporan dan
                            memutuskan kos.
                        </p>
                    </div>
                </Panel>
                <Panel>
                    <h2 className="font-medium">Pilih tanggal survei</h2>
                    <p className="mt-1 text-xs text-[#829088]">
                        Pilih tanggal yang tersedia.
                    </p>
                    <div className="mt-5">
                        <Field label="Tanggal survei">
                            <input
                                type="date"
                                className={inputClass}
                                value={surveyDate}
                                min={minSurveyDate}
                                onChange={(e) => setSurveyDate(e.target.value)}
                            />
                        </Field>
                    </div>
                    <div className="mt-4 rounded-lg bg-[#e8f1ed] p-4 text-xs">
                        <b>
                            Minimal tanggal survei:{" "}
                            {minSurveyDate
                                ? new Date(`${minSurveyDate}T12:00:00`).toLocaleDateString(
                                    "id-ID",
                                    {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    },
                                )
                                : "Memuat tanggal..."}
                        </b>
                        <p className="mt-1 text-[#829088]">
                            Kami memberi jeda setidaknya 2 hari agar survei bisa diterima oleh surveyor.
                        </p>
                    </div>
                    {/* <div className="mt-5">
                        <p className="mb-3 text-xs font-medium">Waktu survei</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {slots.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setTime(s)}
                                    className={`rounded-lg border p-3 text-xs ${time === s ? "border-[#286d62] bg-[#e8f1ed]" : "border-[#dfe7de]"}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div> */}

                </Panel>
                <button className={secondaryButton} onClick={() => router.back()}>
                    ← Kembali
                </button>
            </div>
            <div>
                <OrderSummary />
                <button className={`${primaryButton} mt-3 w-full`} onClick={next}>
                    Tinjau pesanan →
                </button>
            </div>
        </div>
    );
}
