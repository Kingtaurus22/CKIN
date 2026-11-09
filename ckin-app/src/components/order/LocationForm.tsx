
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDraft, saveDraft } from "@/src/lib/order-draft";
import { formatRupiah, PRICE_PER_KOS } from "@/src/types/order";
import type { OrderDraft, SurveyLocation } from "@/src/types/order";
import {
    Panel,
    Field,
    inputClass,
    primaryButton,
    secondaryButton,
} from "./ui";

interface CoverageCity {
    city: string;
    districts: string[];
}

interface CoverageProvince {
    province: string;
    cities: CoverageCity[];
}

export default function LocationForm() {
    const router = useRouter();

    const [coverageAreas, setCoverageAreas] = useState<CoverageProvince[]>([]);

    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");

    const [location, setLocation] = useState<SurveyLocation>({
        province: "",
        city: "",
        district: "",
    });

    const [count, setCount] = useState(1);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch available surveyor coverage areas
    useEffect(() => {
        const controller = new AbortController();

        async function fetchCoverageAreas() {
            try {
                const response = await fetch(
                    "/api/orders/available-surveyors",
                    {
                        signal: controller.signal,
                    },
                );

                const json = await response.json();

                if (!response.ok) {
                    throw new Error(
                        json.message ?? "Gagal mengambil area survei.",
                    );
                }

                const data: CoverageProvince[] = json.data ?? [];

                setCoverageAreas(data);

                // Restore previous order draft
                const old = getDraft();

                if (old.surveyLocation) {
                    const oldLocation = old.surveyLocation;

                    const provinceMatch = data.find(
                        (item) => item.province === oldLocation.province,
                    );

                    const cityMatch = provinceMatch?.cities.find(
                        (item) => item.city === oldLocation.city,
                    );

                    const districtMatch = cityMatch?.districts.find(
                        (item) => item === oldLocation.district,
                    );

                    if (provinceMatch) {
                        setProvince(provinceMatch.province);
                    }

                    if (cityMatch) {
                        setCity(cityMatch.city);
                    }

                    if (districtMatch) {
                        setDistrict(districtMatch);
                    }

                    setLocation({
                        province: provinceMatch?.province ?? "",
                        city: cityMatch?.city ?? "",
                        district: districtMatch ?? "",
                    });

                    setCount(old.kosCount ?? 1);
                }
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name !== "AbortError"
                ) {
                    setError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchCoverageAreas();

        return () => controller.abort();
    }, []);

    // Get cities based on selected province
    const selectedProvince = coverageAreas.find(
        (item) => item.province === province,
    );

    const cities = selectedProvince?.cities ?? [];

    // Get districts based on selected city
    const selectedCity = cities.find(
        (item) => item.city === city,
    );

    const districts = selectedCity?.districts ?? [];

    function handleProvinceChange(value: string) {
        setProvince(value);
        setCity("");
        setDistrict("");

        setLocation({
            province: value,
            city: "",
            district: "",
        });

        setError("");
    }

    function handleCityChange(value: string) {
        setCity(value);
        setDistrict("");

        setLocation((old) => ({
            ...old,
            city: value,
            district: "",
        }));

        setError("");
    }

    function handleDistrictChange(value: string) {
        setDistrict(value);

        setLocation((old) => ({
            ...old,
            district: value,
        }));

        setError("");
    }

    function next() {
        if (!location.province || !location.city || !location.district) {
            setError(
                "Pilih provinsi, kota/kabupaten, dan kecamatan.",
            );
            return;
        }

        saveDraft({
            surveyLocation: location,
            kosCount: count,
        } as Partial<OrderDraft>);

        router.push("/pesanan-baru/sumber-kos");
    }

    return (
        <div className="max-w-[780px]">
            {error && (
                <p role="alert" className="mb-4 text-xs text-red-600">
                    {error}
                </p>
            )}

            <Panel>
                <h2 className="text-lg font-medium">
                    Lokasi tujuan
                </h2>

                <p className="mt-1 text-xs text-[#829088]">
                    Pilih area tujuan survei.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="Provinsi">
                        <select
                            className={inputClass}
                            disabled={loading}
                            value={province}
                            onChange={(e) =>
                                handleProvinceChange(e.target.value)
                            }
                        >
                            <option value="">
                                {loading
                                    ? "Memuat provinsi..."
                                    : "Pilih provinsi"}
                            </option>

                            {coverageAreas.map((item) => (
                                <option
                                    key={item.province}
                                    value={item.province}
                                >
                                    {item.province}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Kota / Kabupaten">
                        <select
                            className={inputClass}
                            disabled={!province || loading}
                            value={city}
                            onChange={(e) =>
                                handleCityChange(e.target.value)
                            }
                        >
                            <option value="">
                                Pilih kota/kabupaten
                            </option>

                            {cities.map((item) => (
                                <option
                                    key={item.city}
                                    value={item.city}
                                >
                                    {item.city}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="mt-5">
                    <Field label="Kecamatan / area kos">
                        <select
                            className={inputClass}
                            disabled={!city || loading}
                            value={district}
                            onChange={(e) =>
                                handleDistrictChange(e.target.value)
                            }
                        >
                            <option value="">
                                Pilih kecamatan
                            </option>

                            {districts.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <fieldset className="mt-6">
                    <legend className="mb-3 text-xs font-medium">
                        Berapa kos yang ingin disurvei?
                    </legend>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {[1, 2, 3, 4].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setCount(n)}
                                className={`rounded-lg border py-4 ${count === n
                                    ? "border-[#286d62] bg-[#e8f1ed]"
                                    : "border-[#dfe7de]"
                                    }`}
                            >
                                <b>{n} kos</b>

                                <span className="mt-1 block text-[10px] text-[#829088]">
                                    {formatRupiah(n * PRICE_PER_KOS)}
                                </span>
                            </button>
                        ))}
                    </div>

                    <p className="mt-3 text-[11px] text-[#829088]">
                        Maksimal 4 kos per pesanan. Biaya survei mulai{" "}
                        {formatRupiah(PRICE_PER_KOS)}/kos.
                    </p>
                </fieldset>
            </Panel>

            <div className="mt-5 flex items-center justify-between">
                <button
                    className={secondaryButton}
                    onClick={() => router.back()}
                >
                    Batal
                </button>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-[#829088]">
                        {count} kos ·{" "}
                        {formatRupiah(count * PRICE_PER_KOS)}
                    </span>

                    <button
                        className={primaryButton}
                        onClick={next}
                        disabled={loading}
                    >
                        Lanjut pilih kos →
                    </button>
                </div>
            </div>
        </div>
    );
}
