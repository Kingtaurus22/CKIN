"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { formatDate } from "@/src/lib/format";
import type { SurveyorOrderCard } from "@/src/types/surveyor";

/** Helper tampilan bersama halaman surveyor (Anggota 3). */

export function genderLabel(value: string | null | undefined) {
  if (!value) return "Kos";
  const v = value.toLowerCase();
  if (v.includes("female") || v.includes("putri") || v.includes("perempuan")) return "Kos putri";
  if (v.includes("male") || v.includes("putra") || v.includes("laki")) return "Kos putra";
  return "Kos campur";
}

export function budgetShort(budget: SurveyorOrderCard["requirements"]["budget"]) {
  if (!budget || (!budget.min && !budget.max)) return "Anggaran fleksibel";
  const juta = (n?: number) => (n ? (n / 1_000_000).toLocaleString("id-ID") : "");
  if (budget.min && budget.max) return `Rp${juta(budget.min)}–${juta(budget.max)} juta/bulan`;
  return budget.max ? `Maks. Rp${juta(budget.max)} juta/bulan` : `Mulai Rp${juta(budget.min)} juta/bulan`;
}

/** "20 Nov" */
export function dayMonth(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" });
}

export function slotText(slot: string | null) {
  return (slot ?? "").replace(/:/g, ".").replace(/\s*-\s*/, "–") || "Jam diatur via chat";
}

export function scheduleText(order: Pick<SurveyorOrderCard, "surveyDate" | "surveyTimeSlot">) {
  return `${formatDate(order.surveyDate)} · ${slotText(order.surveyTimeSlot)}`;
}

export function dateKey(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }) : "";
}

/** Fetch sederhana dengan state loading/error/reload. */
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<T>(url));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}
