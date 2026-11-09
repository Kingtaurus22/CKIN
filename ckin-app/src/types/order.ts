export type ServiceType = "SURVEYOR_RECOMENDATION" | "USER_CHOICE";
export type GenderPreference = "MALE" | "FEMALE" | "ANY";
export type SurveyLocation = {
  province: string;
  city: string;
  district: string;
};
export type OrderTarget = {
  propertyName: string;
  address: string;
  googleMapsUrls?: string;
  ownerContact?: string;
};
export type OrderDraft = {
  surveyLocation: SurveyLocation;
  kosCount: number;
  serviceType: ServiceType;
  requirements: {
    genderPreferences?: GenderPreference;
    budget?: { min: number; max: number };
    facilities?: string[];
    notes?: string;
  };
  targets?: OrderTarget[];
  moveInDate?: string;
  surveyDate?: string;
  surveyTime?: string;
};
export const PRICE_PER_KOS = 75000;
export const SERVICE_FEE = 5000;
export const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
export const getTotal = (count: number) => count * PRICE_PER_KOS + SERVICE_FEE;
