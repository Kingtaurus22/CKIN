"use client";

import { useEffect, useState } from "react";
import type { ServiceType } from "@/src/schemas/order";

/**
 * Draft pesanan baru disimpan di sessionStorage selama alur 4 langkah
 * (dari kode Reynaldo), lalu dikirim sekaligus ke POST /api/orders.
 */
export type OrderDraft = {
  surveyLocation?: {
    provinceId: string;
    province: string;
    cityId: string;
    city: string;
    districtId: string;
    district: string;
  };
  surveyorCount?: number;
  kosCount?: number;
  serviceType?: ServiceType;
  requirements?: {
    genderPreferences?: "FEMALE" | "MALE" | "ANY";
    budget?: { min: number; max: number };
    facilities?: string[];
    landmark?: string;
    notes?: string;
  };
  targets?: Array<{ propertyName: string; address: string; googleMapsUrls: string; ownerContact: string }>;
  moveInDate?: string;
  surveyDate?: string;
  surveyTimeSlot?: string;
};

const KEY = "ckin-order-draft";

export function getDraft(): OrderDraft {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as OrderDraft;
  } catch {
    return {};
  }
}

export function saveDraft(patch: Partial<OrderDraft>) {
  const next = { ...getDraft(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* sessionStorage penuh / diblokir — draft hanya hidup di memori */
  }
  return next;
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}

/** Baca draft setelah mount (sessionStorage tidak tersedia saat render server). */
export function useDraft() {
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  useEffect(() => setDraft(getDraft()), []);
  return draft;
}

/** Payload untuk POST /api/orders sesuai jenis layanan. */
export function toOrderPayload(d: OrderDraft) {
  const common = {
    serviceType: d.serviceType,
    surveyLocation: d.surveyLocation,
    kosCount: d.kosCount,
    moveInDate: d.moveInDate,
    surveyDate: d.surveyDate,
    surveyTimeSlot: d.surveyTimeSlot,
  };
  if (d.serviceType === "USER_CHOICE") {
    return {
      ...common,
      requirements: { notes: d.requirements?.notes ?? "" },
      targets: d.targets ?? [],
    };
  }
  return {
    ...common,
    requirements: {
      genderPreferences: d.requirements?.genderPreferences,
      budget: d.requirements?.budget,
      facilities: d.requirements?.facilities ?? [],
      landmark: d.requirements?.landmark ?? "",
      notes: d.requirements?.notes ?? "",
    },
    targets: [],
  };
}
