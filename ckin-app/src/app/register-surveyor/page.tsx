"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Region = {
    id: string;
    name: string;
};

type SurveyorForm = {
    name: string;
    email: string;
    whatsapp: string;
    password: string;
    province: string;
    city: string;
    district: string;
    surveyDistricts: string[];
};

const REGION_API =
    "https://www.emsifa.com/api-wilayah-indonesia/api";

const initialForm: SurveyorForm = {
    name: "",
    email: "",
    whatsapp: "",
    password: "",
    province: "",
    city: "",
    district: "",
    surveyDistricts: [],
};

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";

const labelClass =
    "mb-1.5 block text-sm font-medium text-gray-700";

async function fetchRegions(url: string): Promise<Region[]> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Gagal mengambil data wilayah");
    }

    return response.json();
}

export default function RegisterSurveyorPage() {
    const [form, setForm] = useState<SurveyorForm>(initialForm);

    const [provinces, setProvinces] = useState<Region[]>([]);
    const [cities, setCities] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<Region[]>([]);

    const [provinceId, setProvinceId] = useState("");
    const [cityId, setCityId] = useState("");
    const [districtId, setDistrictId] = useState("");

    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    const [ktp, setKtp] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);

    const [consent, setConsent] = useState(false);

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    // =========================
    // Load provinces
    // =========================

    useEffect(() => {
        let active = true;

        async function loadProvinces() {
            setLoadingProvinces(true);

            try {
                const data = await fetchRegions(
                    `${REGION_API}/provinces.json`
                );

                if (active) {
                    setProvinces(data);
                }
            } catch (error) {
                console.error("Gagal mengambil provinsi:", error);

                if (active) {
                    setError(
                        "Data provinsi belum dapat dimuat. Silakan coba lagi."
                    );
                }
            } finally {
                if (active) {
                    setLoadingProvinces(false);
                }
            }
        }

        loadProvinces();

        return () => {
            active = false;
        };
    }, []);

    // =========================
    // Form change
    // =========================

    function handleChange(
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    // =========================
    // Province change
    // =========================

    async function handleProvinceChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const selectedId = event.target.value;

        const selectedProvince = provinces.find(
            (province) => province.id === selectedId
        );

        setProvinceId(selectedId);
        setCityId("");
        setDistrictId("");

        setCities([]);
        setDistricts([]);

        setForm((prev) => ({
            ...prev,
            province: selectedProvince?.name ?? "",
            city: "",
            district: "",
        }));

        setError("");

        if (!selectedId) {
            return;
        }

        setLoadingCities(true);

        try {
            const data = await fetchRegions(
                `${REGION_API}/regencies/${selectedId}.json`
            );

            setCities(data);
        } catch (error) {
            console.error("Gagal mengambil kota/kabupaten:", error);

            setError(
                "Data kota/kabupaten belum dapat dimuat. Silakan coba lagi."
            );
        } finally {
            setLoadingCities(false);
        }
    }

    // =========================
    // City change
    // =========================

    async function handleCityChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const selectedId = event.target.value;

        const selectedCity = cities.find(
            (city) => city.id === selectedId
        );

        setCityId(selectedId);
        setDistrictId("");

        setDistricts([]);

        setForm((prev) => ({
            ...prev,
            city: selectedCity?.name ?? "",
            district: "",
            surveyDistricts: [],
        }));

        setError("");

        if (!selectedId) {
            return;
        }

        setLoadingDistricts(true);

        try {
            const data = await fetchRegions(
                `${REGION_API}/districts/${selectedId}.json`
            );

            setDistricts(data);
        } catch (error) {
            console.error("Gagal mengambil kecamatan:", error);

            setError(
                "Data kecamatan belum dapat dimuat. Silakan coba lagi."
            );
        } finally {
            setLoadingDistricts(false);
        }
    }

    // =========================
    // District change
    // =========================

    function handleDistrictChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const selectedId = event.target.value;

        const selectedDistrict = districts.find(
            (district) => district.id === selectedId
        );

        setDistrictId(selectedId);

        setForm((prev) => ({
            ...prev,
            district: selectedDistrict?.name ?? "",
        }));
    }

    // =========================
    // Survey area checkbox
    // =========================

    function handleSurveyDistrictChange(
        districtName: string,
        checked: boolean
    ) {
        setForm((prev) => ({
            ...prev,
            surveyDistricts: checked
                ? [...prev.surveyDistricts, districtName]
                : prev.surveyDistricts.filter(
                      (district) => district !== districtName
                  ),
        }));
    }

    // =========================
    // File change
    // =========================

    function handleKtpChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0] ?? null;

        if (file && file.size > 5 * 1024 * 1024) {
            setError("Ukuran foto KTP maksimal 5 MB.");
            event.target.value = "";
            setKtp(null);
            return;
        }

        setError("");
        setKtp(file);
    }

    function handleSelfieChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0] ?? null;

        if (file && file.size > 5 * 1024 * 1024) {
            setError("Ukuran foto selfie maksimal 5 MB.");
            event.target.value = "";
            setSelfie(null);
            return;
        }

        setError("");
        setSelfie(file);
    }

    // =========================
    // Submit
    // =========================

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");

        if (!provinceId || !cityId || !districtId) {
            setError("Silakan lengkapi domisili.");
            return;
        }

        if (form.surveyDistricts.length === 0) {
            setError("Silakan pilih minimal satu kecamatan area survei.");
            return;
        }

        if (!ktp || !selfie) {
            setError("Silakan lengkapi foto KTP dan selfie.");
            return;
        }

        if (!consent) {
            setError("Silakan setujui ketentuan pendaftaran.");
            return;
        }

        setSubmitting(true);

        try {
            // TODO:
            // Hubungkan ke API registrasi Surveyor CKIN.
            // Upload KTP dan selfie menggunakan FormData.
            // Jangan menyimpan password atau file identitas
            // hanya di state frontend.

            console.log("Data pendaftaran:", {
                ...form,
                provinceId,
                cityId,
                districtId,
                coverageAreas: {
                    province: form.province,
                    city: form.city,
                    districts: form.surveyDistricts,
                },
                ktp,
                selfie,
                consent,
            });

            setError(
                "Form sudah tervalidasi. Registrasi backend belum dihubungkan."
            );
        } catch (error) {
            console.error("Registrasi gagal:", error);

            setError(
                "Pendaftaran belum berhasil. Silakan coba lagi."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-100 px-3 py-5 sm:px-5 sm:py-8">
            <div className="mx-auto w-full max-w-3xl">

            {/* =========================
            HEADER
            ========================= */}

                <header className="mb-4 rounded-2xl bg-white p-5 shadow-sm sm:p-7">

                    <div className="mb-5">
                         <Link href="/" className="-ml-7 inline-flex items-center">
                            <Image
                                src="/ckin-logo.png"
                                alt="CKIN Cari Kost"
                                width={180}
                                height={90}
                                priority
                                className="h-auto w-32 object-contain sm:w-36"
                            />
                        </Link>
                    </div>

                    {/* Role Selection */}
                    <div className="mb-5">
                

                        <div className="grid grid-cols-2 gap-2.5">

                            {/* User */}
                            <Link
                                href="/register"
                                className="rounded-xl border border-gray-200 bg-white p-3 transition hover:border-teal-400"
                            >
                                <div className="flex items-center justify-between">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="19"
                                        height="19"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-teal-900"
                                    >
                                        <path d="m3 10 9-7 9 7" />
                                        <path d="M5 9v12h14V9" />
                                        <path d="M9 21v-8h6v8" />
                                    </svg>

                                    <span className="h-2.5 w-2.5 rounded-full border border-gray-300" />
                                </div>

                                <p className="mt-2 text-sm font-medium text-gray-800">
                                    Pengguna
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Cari & survei kos
                                </p>
                            </Link>

                            {/* Surveyor */}
                            <Link
                                href="/register-surveyor"
                                className="rounded-xl border border-teal-800 bg-teal-50/70 p-3"
                            >
                                <div className="flex items-center justify-between">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="19"
                                        height="19"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-teal-900"
                                    >
                                        <circle cx="12" cy="8" r="3" />
                                        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
                                        <path d="M19 8h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
                                        <path d="M5 8H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
                                    </svg>

                                    <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full border border-teal-800">
                                        <span className="h-1.5 w-1.5 rounded-full bg-teal-800" />
                                    </span>
                                </div>

                                <p className="mt-2 text-sm font-medium text-gray-800">
                                    Surveyor
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Daftar surveyor
                                </p>
                            </Link>

                        </div>
                    </div>

                    {/* Title */}
                    <div className="mt-5">

                        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                            Bergabung bersama CKIN
                        </p>

                        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Daftar sebagai Surveyor
                        </h1>

                    </div>

                </header>


                {/* =========================
                FORM
                ========================= */}

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"
                >

                {/* =========================
                ACCOUNT
                ========================= */}

                    <section>

                        <div className="mb-4">

                            <h2 className="text-base font-semibold text-gray-900">
                                Informasi Akun
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                Masukkan informasi untuk membuat akun Surveyor.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            {/* Name */}
                            <div className="sm:col-span-2">

                                <label htmlFor="name" className={labelClass}>
                                    Nama Lengkap
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Masukkan nama lengkap"
                                    value={form.name}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                />

                            </div>

                            {/* Email */}
                            <div>

                                <label htmlFor="email" className={labelClass}>
                                    Email
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                />

                            </div>

                            {/* WhatsApp */}
                            <div>

                                <label htmlFor="whatsapp" className={labelClass}>
                                    Nomor WhatsApp
                                </label>

                                <input
                                    id="whatsapp"
                                    name="whatsapp"
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder="08xxxxxxxxxx"
                                    value={form.whatsapp}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                />

                            </div>

                            {/* Password */}
                            <div className="sm:col-span-2">

                                <label htmlFor="password" className={labelClass}>
                                    Password
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Minimal 8 karakter"
                                    minLength={8}
                                    value={form.password}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                />

                            </div>

                        </div>

                    </section>

                    <div className="my-6 border-t border-gray-100" />


                {/* =========================
                DOMISILI AREA
                ========================= */}

                    <section>

                        <div className="mb-4">

                            <h2 className="text-base font-semibold text-gray-900">
                                Domisili
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                Tentukan wilayah kost yang dapat kamu survei.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            {/* Province */}
                            <div>

                                <label htmlFor="province" className={labelClass}>
                                    Provinsi
                                </label>

                                <select
                                    id="province"
                                    name="province"
                                    value={provinceId}
                                    onChange={handleProvinceChange}
                                    className={inputClass}
                                    required
                                >

                                    <option value="">
                                        {loadingProvinces
                                            ? "Memuat provinsi..."
                                            : "Pilih provinsi"}
                                    </option>

                                    {provinces.map((province) => (
                                        <option
                                            key={province.id}
                                            value={province.id}
                                        >
                                            {province.name}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            {/* City */}
                            <div>

                                <label htmlFor="city" className={labelClass}>
                                    Kota / Kabupaten
                                </label>

                                <select
                                    id="city"
                                    name="city"
                                    value={cityId}
                                    onChange={handleCityChange}
                                    disabled={!provinceId || loadingCities}
                                    className={inputClass}
                                    required
                                >

                                    <option value="">
                                        {loadingCities
                                            ? "Memuat kota/kabupaten..."
                                            : "Pilih kota/kabupaten"}
                                    </option>

                                    {cities.map((city) => (
                                        <option
                                            key={city.id}
                                            value={city.id}
                                        >
                                            {city.name}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            {/* District */}
                            <div>

                                <label htmlFor="district" className={labelClass}>
                                    Kecamatan
                                </label>

                                <select
                                    id="district"
                                    name="district"
                                    value={districtId}
                                    onChange={handleDistrictChange}
                                    disabled={!cityId || loadingDistricts}
                                    className={inputClass}
                                    required
                                >

                                    <option value="">
                                        {loadingDistricts
                                            ? "Memuat kecamatan..."
                                            : "Pilih kecamatan"}
                                    </option>

                                    {districts.map((district) => (
                                        <option
                                            key={district.id}
                                            value={district.id}
                                        >
                                            {district.name}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            {/* Survey Area */}
                            <div className="sm:col-span-2">

                                <label className={labelClass}>
                                    Area Survei
                                </label>

                                <p className="mb-3 text-xs text-gray-500">
                                    Pilih satu atau beberapa kecamatan yang dapat kamu jangkau.
                                </p>

                                {!cityId ? (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                        Pilih kota/kabupaten terlebih dahulu.
                                    </div>
                                ) : loadingDistricts ? (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                        Memuat daftar kecamatan...
                                    </div>
                                ) : districts.length === 0 ? (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                        Daftar kecamatan belum tersedia.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-x-4 rounded-xl border border-gray-200 p-2 sm:grid-cols-2">
                                        {districts.map((district) => (
                                            <label
                                                key={district.id}
                                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 transition hover:bg-teal-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.surveyDistricts.includes(district.name)}
                                                    onChange={(event) =>
                                                        handleSurveyDistrictChange(
                                                            district.name,
                                                            event.target.checked
                                                        )
                                                    }
                                                    className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
                                                />
                                                <span>{district.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                            </div>


                        </div>

                    </section>

                    <div className="my-6 border-t border-gray-100" />


                {/* =========================
                VERIFICATION
                ========================= */}

                    <section>

                        <div className="mb-4">

                            <h2 className="text-base font-semibold text-gray-900">
                                Verifikasi Identitas
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                Unggah dokumen untuk membantu proses verifikasi akun.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            {/* KTP */}
                            <div>

                                <label htmlFor="ktp" className={labelClass}>
                                    Foto KTP
                                </label>

                                <label
                                    htmlFor="ktp"
                                    className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center transition hover:border-teal-500 hover:bg-teal-50/50"
                                >

                                    <span className="text-sm font-medium text-gray-700">
                                        {ktp ? ktp.name : "Pilih foto KTP"}
                                    </span>

                                    <span className="mt-1 text-xs text-gray-400">
                                        JPG, PNG atau PDF · Maks. 5 MB
                                    </span>

                                    <input
                                        id="ktp"
                                        type="file"
                                        accept="image/jpeg,image/png,application/pdf"
                                        className="sr-only"
                                        onChange={handleKtpChange}
                                        required
                                    />

                                </label>

                            </div>

                            {/* Selfie */}
                            <div>

                                <label htmlFor="selfie" className={labelClass}>
                                    Foto Selfie
                                </label>

                                <label
                                    htmlFor="selfie"
                                    className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center transition hover:border-teal-500 hover:bg-teal-50/50"
                                >

                                    <span className="text-sm font-medium text-gray-700">
                                        {selfie ? selfie.name : "Pilih foto selfie"}
                                    </span>

                                    <span className="mt-1 text-xs text-gray-400">
                                        JPG atau PNG · Maks. 5 MB
                                    </span>

                                    <input
                                        id="selfie"
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        className="sr-only"
                                        onChange={handleSelfieChange}
                                        required
                                    />

                                </label>

                            </div>

                        </div>

                        {/* Verification Info */}
                        <div className="mt-4 rounded-xl bg-teal-50 px-4 py-3">

                            <p className="text-xs leading-relaxed text-teal-800">
                                Akun Surveyor akan melalui proses pemeriksaan
                                sebelum dapat digunakan untuk melakukan survei.
                            </p>

                        </div>

                    </section>

                    <div className="my-6 border-t border-gray-100" />


                {/* =========================
                CONSENT
                ========================= */}

                    <section>

                        <label className="flex cursor-pointer items-start gap-3">

                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(event) =>
                                    setConsent(event.target.checked)
                                }
                                className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
                                required
                            />

                            <span className="text-xs leading-relaxed text-gray-600">
                                Saya menyatakan bahwa informasi yang diberikan
                                benar dan bersedia mengikuti ketentuan serta
                                proses verifikasi Surveyor CKIN.
                            </span>

                        </label>

                    </section>


                {/* =========================
                ERROR
                ========================= */}

                    {error && (
                        <div
                            role="alert"
                            className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800"
                        >
                            {error}
                        </div>
                    )}


                {/* =========================
                SUBMIT
                ========================= */}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-6 w-full rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting
                            ? "Memproses..."
                            : "Daftar sebagai Surveyor"}
                    </button>

                    {/* Login */}
                    <p className="mt-4 text-center text-sm text-gray-500">

                        Sudah memiliki akun?{" "}

                        <Link
                            href="/login"
                            className="font-semibold text-teal-700 hover:text-teal-800"
                        >
                            Masuk
                        </Link>

                    </p>

                </form>

            {/* =========================
            FOOTER
            ========================= */}

                <footer className="mt-5 text-center text-xs text-gray-400">
                    © {year ?? "2026"} CKIN · Cari Kost
                </footer>
            </div>
        </main>
    );
}
