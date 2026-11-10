"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ErrorState, Skeleton } from "@/src/components/ui/common";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { formatRupiah, regionLabel, shortCity } from "@/src/lib/format";
import { MAX_KOS, PRICE_PER_KOS } from "@/src/lib/pricing";
import type { AvailableProvince } from "@/db/models/SurveyorModel";
import { getDraft, saveDraft } from "./draft";
import { OrderPage } from "./OrderFlow";

/** Langkah 1 — lokasi tujuan & jumlah kos (hanya area yang dijangkau surveyor). */
export default function LocationStep() {
  const router = useRouter();
  const [provinces, setProvinces] = useState<AvailableProvince[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");

  async function load() {
    setLoadError("");
    try {
      const data = await apiFetch<{ provinces: AvailableProvince[] }>("/api/orders/available-surveyors");
      setProvinces(data.provinces);
      const draft = getDraft();
      if (draft.surveyLocation) {
        setProvinceId(draft.surveyLocation.provinceId);
        setCityId(draft.surveyLocation.cityId);
        setDistrictId(draft.surveyLocation.districtId);
      }
      if (draft.kosCount) setCount(draft.kosCount);
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const province = provinces?.find((p) => p.id === provinceId);
  const city = province?.cities.find((c) => c.id === cityId);
  const district = city?.districts.find((d) => d.id === districtId);
  const totalDistricts = useMemo(
    () => (provinces ?? []).reduce((sum, p) => sum + p.cities.reduce((s, c) => s + c.districts.length, 0), 0),
    [provinces],
  );

  function next() {
    if (!province || !city || !district) {
      setError("Pilih provinsi, kota/kabupaten, dan kecamatan tujuan.");
      return;
    }
    saveDraft({
      surveyLocation: {
        provinceId: province.id,
        province: province.name,
        cityId: city.id,
        city: city.name,
        districtId: district.id,
        district: district.name,
      },
      surveyorCount: district.surveyors,
      kosCount: count,
    });
    router.push("/customer/orders/new/sumber-kos");
  }

  return (
    <OrderPage
      eyebrow="Pesanan baru"
      title="Mau cari kos di mana?"
      subtitle="Pilih area tujuan dan jumlah kos. Hanya area yang dijangkau surveyor lokal yang ditampilkan."
      step={0}
    >
      <div className="two-col">
        <div className="stack">
          {loadError && <ErrorState message={loadError} onRetry={load} />}
          <section className="card">
            <h2 className="card-title">Lokasi tujuan</h2>
            <p className="card-sub" style={{ marginBottom: 20 }}>
              Surveyor yang tersedia menyesuaikan domisili dan area jangkauan.
            </p>

            {!provinces && !loadError ? (
              <div className="stack">
                <Skeleton height={44} />
                <Skeleton height={44} />
              </div>
            ) : provinces && provinces.length === 0 ? (
              <div className="alert alert-warning">
                <Icon name="info" size={18} />
                <div>
                  <strong>Belum ada surveyor aktif</strong>
                  Pemesanan dibuka setelah ada surveyor yang mendaftar dan memilih area jangkauan.
                </div>
              </div>
            ) : (
              <>
                <div className="form-grid">
                  <div className="field">
                    <label className="label" htmlFor="o-prov">
                      Provinsi
                    </label>
                    <select
                      id="o-prov"
                      className="select"
                      value={provinceId}
                      onChange={(e) => {
                        setProvinceId(e.target.value);
                        setCityId("");
                        setDistrictId("");
                        setError("");
                      }}
                    >
                      <option value="">Pilih provinsi</option>
                      {provinces?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {regionLabel(p.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="o-city">
                      Kota / Kabupaten
                    </label>
                    <select
                      id="o-city"
                      className="select"
                      value={cityId}
                      disabled={!province}
                      onChange={(e) => {
                        setCityId(e.target.value);
                        setDistrictId("");
                        setError("");
                      }}
                    >
                      <option value="">Pilih kota/kabupaten</option>
                      {province?.cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {regionLabel(c.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field span-2">
                    <label className="label" htmlFor="o-dist">
                      Kecamatan / area kos
                    </label>
                    <select
                      id="o-dist"
                      className="select"
                      value={districtId}
                      disabled={!city}
                      onChange={(e) => {
                        setDistrictId(e.target.value);
                        setError("");
                      }}
                    >
                      <option value="">Pilih kecamatan</option>
                      {city?.districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {regionLabel(d.name)} · {d.surveyors} surveyor
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="label" style={{ margin: "24px 0 12px" }}>
                  Berapa kos yang ingin disurvei?
                </p>
                <div className="count-grid" role="radiogroup" aria-label="Jumlah kos">
                  {Array.from({ length: MAX_KOS }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={count === n}
                      className={`count-opt ${count === n ? "selected" : ""}`}
                      onClick={() => setCount(n)}
                    >
                      <strong>{n} kos</strong>
                      <small>{formatRupiah(n * PRICE_PER_KOS)}</small>
                    </button>
                  ))}
                </div>
                <p className="hint" style={{ marginTop: 12 }}>
                  Maksimal {MAX_KOS} kos per pesanan. Biaya survei {formatRupiah(PRICE_PER_KOS)}/kos.
                </p>
              </>
            )}
          </section>

          {error && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert" size={17} />
              <span>{error}</span>
            </div>
          )}

          <div className="flow-actions">
            <Link className="btn btn-secondary" href="/customer">
              Batal
            </Link>
            <span className="meta">
              {count} kos{district ? ` · ${regionLabel(district.name)}` : ""} · {formatRupiah(count * PRICE_PER_KOS)}
            </span>
            <button type="button" className="btn btn-primary" onClick={next} disabled={!provinces?.length}>
              <Icon name="arrowRight" size={16} /> Lanjut pilih kos
            </button>
          </div>
        </div>

        <aside className="stack">
          <section className="card area-card">
            <h2 className="card-title" style={{ marginBottom: 18 }}>
              Surveyor di area tujuan
            </h2>
            {district ? (
              <>
                <div className="loc">
                  <Icon name="surveyor" size={22} />
                  <div>
                    <strong>
                      {district.surveyors} surveyor aktif di {regionLabel(district.name)}
                    </strong>
                    <small>
                      {shortCity(city?.name)}, {regionLabel(province?.name)}
                    </small>
                  </div>
                </div>
                <p className="hint">
                  Setelah pembayaran berhasil, pesananmu tampil di daftar order surveyor yang menjangkau
                  kecamatan ini. Surveyor pertama yang mengambil akan menghubungimu lewat chat.
                </p>
              </>
            ) : (
              <p className="hint">
                {provinces
                  ? `Surveyor CKIN saat ini menjangkau ${totalDistricts} kecamatan. Pilih lokasi untuk melihat ketersediaan.`
                  : "Memuat area…"}
              </p>
            )}
          </section>
          <div className="alert alert-info">
            <Icon name="info" size={18} />
            <div>
              <strong style={{ fontWeight: 500 }}>Area belum ada?</strong>
              Kami terus menambah surveyor lokal. Coba kecamatan terdekat dari tujuanmu.
            </div>
          </div>
        </aside>
      </div>
    </OrderPage>
  );
}
