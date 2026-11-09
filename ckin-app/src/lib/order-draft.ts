import type { OrderDraft } from "@/src/types/order";
const KEY = "ckin-order-draft";
export function getDraft(): Partial<OrderDraft> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      sessionStorage.getItem(KEY) || "{}",
    ) as Partial<OrderDraft>;
  } catch {
    return {};
  }
}
export function saveDraft(patch: Partial<OrderDraft>) {
  const next = { ...getDraft(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
export function clearDraft() {
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
}
export function makeOrderPayload(d: OrderDraft) {
  const common = {
    surveyLocation: d.surveyLocation,
    kosCount: d.kosCount,
    serviceType: d.serviceType,
    surveyDate: d.surveyDate,
    moveInDate: d.moveInDate,
  };
  if (d.serviceType === "USER_CHOICE") {
    return {
      ...common,
      requirements: { notes: d.requirements.notes ?? "" },
      targets: d.targets ?? [],
    };
  }
  return {
    ...common,
    requirements: {
      genderPreferences: d.requirements.genderPreferences ?? "ANY",
      budget: d.requirements.budget ?? { min: 0, max: 0 },
      facilities: d.requirements.facilities ?? [],
      notes: d.requirements.notes ?? "",
    },
  };
}
