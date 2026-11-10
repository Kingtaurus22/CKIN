"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { regionLabel } from "@/src/lib/format";

/** Data wilayah Indonesia (provinsi → kab/kota → kecamatan). */
const REGION_API = "https://www.emsifa.com/api-wilayah-indonesia/api";

type Region = { id: string; name: string };

export type AreaValue = {
  provinceId: string;
  province: string;
  cityId: string;
  city: string;
  districtId: string;
  district: string;
};

export const emptyArea: AreaValue = {
  provinceId: "",
  province: "",
  cityId: "",
  city: "",
  districtId: "",
  district: "",
};

export type District = { id: string; name: string };

const cache = new Map<string, Promise<Region[]>>();

function loadRegions(path: string): Promise<Region[]> {
  if (!cache.has(path)) {
    const request = fetch(`${REGION_API}/${path}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data wilayah");
        return res.json() as Promise<Region[]>;
      })
      .catch((error) => {
        cache.delete(path);
        throw error;
      });
    cache.set(path, request);
  }
  return cache.get(path)!;
}

function useRegions(path: string | null) {
  const [items, setItems] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!path) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(false);
    loadRegions(path)
      .then((data) => active && setItems(data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [path]);

  return { items, loading, error };
}

/**
 * Pilihan Provinsi / Kabupaten-kota / Kecamatan + (opsional) area jangkauan.
 * Dipakai di form daftar surveyor dan halaman pengaturan akun.
 */
export default function AreaFields({
  value,
  onChange,
  coverage,
  onCoverageChange,
  errors = {},
}: {
  value: AreaValue;
  onChange: (value: AreaValue) => void;
  coverage?: District[];
  onCoverageChange?: (value: District[]) => void;
  errors?: { area?: string; coverage?: string };
}) {
  const provinces = useRegions("provinces.json");
  const cities = useRegions(value.provinceId ? `regencies/${value.provinceId}.json` : null);
  const districts = useRegions(value.cityId ? `districts/${value.cityId}.json` : null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadError = provinces.error || cities.error || districts.error;
  const selectedIds = useMemo(() => new Set(coverage?.map((d) => d.id)), [coverage]);

  function selectProvince(id: string) {
    const item = provinces.items.find((p) => p.id === id);
    onChange({ ...emptyArea, provinceId: id, province: item?.name ?? "" });
    onCoverageChange?.([]);
  }

  function selectCity(id: string) {
    const item = cities.items.find((c) => c.id === id);
    onChange({ ...value, cityId: id, city: item?.name ?? "", districtId: "", district: "" });
    onCoverageChange?.([]);
  }

  function selectDistrict(id: string) {
    const item = districts.items.find((d) => d.id === id);
    onChange({ ...value, districtId: id, district: item?.name ?? "" });
    // Kecamatan domisili otomatis jadi area jangkauan pertama.
    if (item && onCoverageChange && coverage && !coverage.some((d) => d.id === id)) {
      onCoverageChange([{ id: item.id, name: item.name }, ...coverage]);
    }
  }

  function toggleCoverage(item: Region, checked: boolean) {
    if (!onCoverageChange || !coverage) return;
    onCoverageChange(
      checked
        ? [...coverage, { id: item.id, name: item.name }]
        : coverage.filter((d) => d.id !== item.id),
    );
  }

  return (
    <>
      <div className="form-grid three">
        <div className="field">
          <label className="label" htmlFor="province">
            Provinsi
          </label>
          <select
            id="province"
            className="select"
            value={value.provinceId}
            onChange={(e) => selectProvince(e.target.value)}
          >
            <option value="">{provinces.loading ? "Memuat…" : "Pilih provinsi"}</option>
            {provinces.items.map((p) => (
              <option key={p.id} value={p.id}>
                {regionLabel(p.name)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="city">
            Kabupaten / kota
          </label>
          <select
            id="city"
            className="select"
            value={value.cityId}
            disabled={!value.provinceId || cities.loading}
            onChange={(e) => selectCity(e.target.value)}
          >
            <option value="">{cities.loading ? "Memuat…" : "Pilih kab/kota"}</option>
            {cities.items.map((c) => (
              <option key={c.id} value={c.id}>
                {regionLabel(c.name)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="district">
            Kecamatan
          </label>
          <select
            id="district"
            className="select"
            value={value.districtId}
            disabled={!value.cityId || districts.loading}
            onChange={(e) => selectDistrict(e.target.value)}
          >
            <option value="">{districts.loading ? "Memuat…" : "Pilih kecamatan"}</option>
            {districts.items.map((d) => (
              <option key={d.id} value={d.id}>
                {regionLabel(d.name)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {errors.area && <span className="field-error">{errors.area}</span>}
      {loadError && (
        <span className="field-error">
          Data wilayah belum dapat dimuat. Periksa koneksi internet lalu muat ulang halaman.
        </span>
      )}

      {coverage && onCoverageChange && (
        <div className="field" style={{ marginTop: 18 }}>
          <span className="label">Area jangkauan survei</span>
          <div className="chip-box">
            {coverage.map((d) => (
              <span className="chip" key={d.id}>
                {regionLabel(d.name)}
                <button
                  type="button"
                  aria-label={`Hapus ${regionLabel(d.name)}`}
                  onClick={() => onCoverageChange(coverage.filter((x) => x.id !== d.id))}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              className="chip-add"
              disabled={!value.cityId}
              onClick={() => setPickerOpen((open) => !open)}
              aria-expanded={pickerOpen}
            >
              {pickerOpen ? "Selesai memilih" : "+ Tambah area"}
            </button>
          </div>
          {pickerOpen && value.cityId && (
            <div className="chip-picker" role="group" aria-label="Pilih kecamatan">
              {districts.items.map((d) => (
                <label key={d.id}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(d.id)}
                    onChange={(e) => toggleCoverage(d, e.target.checked)}
                  />
                  {regionLabel(d.name)}
                </label>
              ))}
            </div>
          )}
          <span className={errors.coverage ? "field-error" : "hint"}>
            {errors.coverage ??
              (value.city
                ? `Bisa pilih lebih dari satu kecamatan di ${regionLabel(value.city)}.`
                : "Pilih kabupaten/kota domisili terlebih dahulu.")}
          </span>
        </div>
      )}
    </>
  );
}

export function UploadBox({
  id,
  label,
  hint,
  icon,
  file,
  onFile,
  error,
}: {
  id: string;
  label: string;
  hint: string;
  icon: "idCard" | "camera";
  file: File | null;
  onFile: (file: File | null) => void;
  error?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="field">
      <span className="label">{label}</span>
      <label
        htmlFor={id}
        className={`upload-box ${dragging ? "dragging" : ""} ${file ? "filled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="upload-preview" src={preview} alt={`Pratinjau ${label}`} />
        ) : (
          <Icon name={icon} size={22} />
        )}
        <strong>{file ? file.name : "Pilih foto atau seret ke sini"}</strong>
        <span>{file ? "Klik untuk mengganti" : "JPG / PNG · maks. 5 MB"}</span>
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <span className={error ? "field-error" : "hint"}>{error ?? hint}</span>
    </div>
  );
}
