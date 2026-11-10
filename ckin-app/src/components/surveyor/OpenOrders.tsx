"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ConfirmModal, EmptyState, ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { formatDate, formatRupiah, initials, regionLabel } from "@/src/lib/format";
import { PRICE_PER_KOS } from "@/src/lib/pricing";
import type { SurveyorOrderCard } from "@/src/types/surveyor";
import { budgetShort, dateKey, dayMonth, genderLabel, slotText, useApi } from "./shared";

type OpenData = {
  orders: SurveyorOrderCard[];
  activeCount: number;
  activeDates: string[];
  maxActive: number;
  verified: boolean;
  acceptingOrders: boolean;
  coverage: { city: string; districts: string[] };
};

/** Halaman "Order tersedia" — order terbayar di area jangkauan yang belum diambil surveyor. */
export default function OpenOrders() {
  const router = useRouter();
  const { user } = useWorkspace();
  const { data, error, loading, reload } = useApi<OpenData>("/api/surveyor/open-orders");
  const [areas, setAreas] = useState<string[] | null>(null); // null = semua area
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [taking, setTaking] = useState(false);
  const [takeError, setTakeError] = useState("");

  const coverage = data?.coverage.districts ?? [];
  const activeAreas = areas ?? coverage;

  const filtered = useMemo(() => {
    const list = data?.orders ?? [];
    return list.filter((o) => {
      const district = coverage.find((d) => d.toLowerCase() === o.district.toLowerCase());
      if (district && !activeAreas.includes(district)) return false;
      const key = dateKey(o.surveyDate);
      if (from && key < from) return false;
      if (to && key > to) return false;
      return true;
    });
  }, [data, coverage, activeAreas, from, to]);

  const selected = filtered.find((o) => o.id === selectedId) ?? filtered[0] ?? null;
  const quotaFull = data ? data.activeCount >= data.maxActive : false;
  const busyDates = new Set(data?.activeDates ?? []);
  const dateTaken = (o: SurveyorOrderCard | null) => (o ? busyDates.has(dateKey(o.surveyDate)) : false);
  const blocked = data ? !data.verified || !data.acceptingOrders || quotaFull || dateTaken(selected) : true;

  function toggleArea(district: string) {
    const next = activeAreas.includes(district)
      ? activeAreas.filter((d) => d !== district)
      : [...activeAreas, district];
    setAreas(next);
  }

  function reset() {
    setAreas(null);
    setFrom("");
    setTo("");
  }

  async function take() {
    if (!selected) return;
    setTaking(true);
    setTakeError("");
    try {
      await apiFetch(`/api/surveyor/open-orders/${selected.id}/assign`, { method: "POST" });
      router.push(`/surveyor/orders/${selected.id}?taken=1`);
    } catch (err) {
      setTakeError(errorMessage(err));
      setTaking(false);
      void reload();
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Ruang surveyor"
        title="Order tersedia"
        subtitle="Temukan survei di area yang kamu kenal. Pilih jadwal yang cocok untukmu."
        actions={
          user && (
            <StatusPill tone={user.acceptingOrders === false ? "muted" : "success"}>
              {user.acceptingOrders === false ? "Tidak menerima order" : "Aktif menerima order"}
            </StatusPill>
          )
        }
      />

      <section className="card sv-filter" aria-label="Filter order">
        <div className="sv-filter-areas">
          <Icon name="sliders" size={18} />
          <span className="label-inline">Area</span>
          {coverage.length === 0 && !loading && <span className="muted">Belum ada area jangkauan</span>}
          {coverage.map((d) => {
            const on = activeAreas.includes(d);
            return (
              <button
                key={d}
                type="button"
                className={`sv-chip ${on ? "on" : ""}`}
                aria-pressed={on}
                onClick={() => toggleArea(d)}
              >
                {regionLabel(d)} {on && <Icon name="check" size={12} />}
              </button>
            );
          })}
        </div>
        <div className="sv-filter-dates">
          <span className="muted">Jadwal survei</span>
          <label className="sv-date">
            <Icon name="calendar" size={15} />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Dari tanggal" />
          </label>
          <span className="muted">–</span>
          <label className="sv-date">
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} aria-label="Sampai tanggal" />
          </label>
          <button type="button" className="text-link" onClick={reset}>
            Reset
          </button>
        </div>
      </section>

      <div className="alert alert-success sv-banner">
        <Icon name="shield" size={18} />
        <div>
          <strong>Hanya order sudah dibayar yang bisa diambil</strong>
          Semua order di bawah belum memiliki surveyor dan sesuai area jangkauanmu. Pembayaran customer sudah
          dikonfirmasi.
        </div>
      </div>

      <div className="sv-quota" role="note">
        <Icon name="clipboard" size={18} />
        <div className="grow">
          <strong>Maks. {data?.maxActive ?? 3} pesanan per surveyor</strong>
          <span>Setiap pesanan harus di tanggal survei yang berbeda — tidak bisa dua survei di tanggal yang sama.</span>
        </div>
        <div className="sv-quota-meter" aria-label={`Order berjalan ${data?.activeCount ?? 0} dari ${data?.maxActive ?? 3}`}>
          {Array.from({ length: data?.maxActive ?? 3 }).map((_, i) => (
            <span key={i} className={i < (data?.activeCount ?? 0) ? "on" : ""} />
          ))}
          <small>
            {data?.activeCount ?? 0}/{data?.maxActive ?? 3} berjalan
          </small>
        </div>
      </div>

      {data && !data.verified && (
        <div className="alert alert-warning sv-banner">
          <Icon name="alert" size={18} />
          <div>
            <strong>Akun belum terverifikasi</strong>
            Kamu bisa melihat order, tetapi baru dapat mengambilnya setelah akun disetujui tim CKIN.
          </div>
        </div>
      )}
      {data && data.verified && !data.acceptingOrders && (
        <div className="alert alert-warning sv-banner">
          <Icon name="alert" size={18} />
          <div>
            <strong>Kamu sedang tidak menerima order</strong>
            Aktifkan &quot;Aktif menerima order&quot; di <Link href="/surveyor/settings">Pengaturan akun</Link> untuk
            mengambil order.
          </div>
        </div>
      )}
      {data && quotaFull && (
        <div className="alert alert-warning sv-banner">
          <Icon name="info" size={18} />
          <div>
            <strong>
              Kuota order berjalan penuh ({data.activeCount}/{data.maxActive})
            </strong>
            Selesaikan salah satu survei di <Link href="/surveyor/orders">Order survei</Link> sebelum mengambil order
            baru.
          </div>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={reload} />}

      <div className="two-col sv-open">
        <div className="stack">
          <div className="sv-list-head">
            <strong>{loading ? "Memuat order…" : `${filtered.length} order sesuai filter`}</strong>
            <span className="muted">Urutkan: Jadwal terdekat ↓</span>
          </div>

          {loading && [0, 1, 2].map((i) => <Skeleton key={i} height={190} style={{ borderRadius: 14 }} />)}

          {!loading && filtered.length === 0 && (
            <div className="card">
              <EmptyState
                title="Belum ada order di areamu"
                description="Order baru muncul setelah customer menyelesaikan pembayaran. Coba perluas filter area atau tanggal."
              />
            </div>
          )}

          {filtered.map((o) => {
            const isSelected = selected?.id === o.id;
            return (
              <article key={o.id} className={`card sv-order ${isSelected ? "selected" : ""}`}>
                <div className="sv-order-top">
                  <span className="avatar">{initials(o.customer.name)}</span>
                  <div className="grow">
                    <h3>{o.location}</h3>
                    <small>
                      {o.customer.name} · #{o.code}
                    </small>
                  </div>
                  <StatusPill tone="success">Sudah dibayar</StatusPill>
                </div>
                <p className="sv-order-main">
                  {genderLabel(o.requirements.genderPreferences)} · {budgetShort(o.requirements.budget)}
                </p>
                <p className="sv-order-meta">
                  {o.kosCount} kos · {o.serviceType} · Belum diambil
                </p>
                <p className="sv-order-meta">
                  <Icon name="calendar" size={14} /> {dayMonth(o.surveyDate)} · {slotText(o.surveyTimeSlot)}
                  {dateTaken(o) && <span className="sv-clash">Bentrok dengan jadwalmu</span>}
                </p>
                <div className="sv-order-foot">
                  <div>
                    <span className="label-sm">Pendapatan bersih</span>
                    <strong>{formatRupiah(o.earning)}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedId(o.id)}
                    aria-pressed={isSelected}
                  >
                    <Icon name={isSelected ? "check" : "arrowRight"} size={15} />
                    {isSelected ? "Detail dipilih" : "Lihat detail"}
                  </button>
                </div>
              </article>
            );
          })}

          {!loading && data && filtered.length < data.orders.length && (
            <p className="muted" style={{ fontSize: 12 }}>
              {filtered.length} dari {data.orders.length} order di areamu · Perluas area atau tanggal untuk melihat order
              lainnya.
            </p>
          )}
        </div>

        <aside className="stack">
          {selected ? (
            <section className="card sv-detail">
              <h2 className="card-title">Detail order</h2>
              <div className="sv-detail-code">
                <strong>#{selected.code}</strong>
                <StatusPill tone="success">Sudah dibayar</StatusPill>
              </div>
              <div className="sv-person">
                <span className="avatar">{initials(selected.customer.name)}</span>
                <div>
                  <strong>{selected.customer.name}</strong>
                  <small>Customer · {selected.serviceType}</small>
                </div>
              </div>
              <div className="sv-kv">
                <div>
                  <span>Lokasi</span>
                  <strong>{selected.location}</strong>
                </div>
                <div>
                  <span>Jadwal</span>
                  <strong>{formatDate(selected.surveyDate, "long")}</strong>
                </div>
                <div>
                  <span>Waktu</span>
                  <strong>{slotText(selected.surveyTimeSlot)}</strong>
                </div>
                <div>
                  <span>Jumlah kos</span>
                  <strong>
                    {selected.kosCount} kos {selected.isUserChoice ? "pilihan customer" : "rekomendasi surveyor"}
                  </strong>
                </div>
              </div>

              <h3 className="sv-sub">Kebutuhan survei</h3>
              <p className="muted sv-par">
                {genderLabel(selected.requirements.genderPreferences)} dengan anggaran{" "}
                {budgetShort(selected.requirements.budget)}
                {selected.requirements.landmark ? `. Dekat ${selected.requirements.landmark}` : ""}
                {selected.requirements.facilities.length > 0
                  ? `. Fasilitas: ${selected.requirements.facilities.join(", ")}`
                  : ""}
                .
              </p>
              <ul className="sv-checks">
                <li>
                  <Icon name="check" size={14} /> Cek kebersihan, sirkulasi udara, dan tekanan air
                </li>
                <li>
                  <Icon name="check" size={14} /> Konfirmasi Wi-Fi, listrik, serta biaya tambahan
                </li>
                <li>
                  <Icon name="check" size={14} /> Foto kamar, fasilitas bersama, dan akses jalan
                </li>
              </ul>
              {selected.requirements.notes && <div className="note-box">“{selected.requirements.notes}”</div>}

              {selected.isUserChoice && selected.targets.length > 0 && (
                <div className="sv-targets">
                  <strong>Daftar kos pilihan</strong>
                  {selected.targets.map((t, i) => (
                    <p key={`${t.name}-${i}`}>{t.name}</p>
                  ))}
                  <small>Alamat lengkap dan kontak pemilik tersedia setelah order diambil.</small>
                </div>
              )}

              <div className="sv-earn">
                <div>
                  <span>
                    {selected.kosCount} kos × {formatRupiah(PRICE_PER_KOS)}
                  </span>
                  <span>{formatRupiah(selected.earning)}</span>
                </div>
                <div className="total">
                  <span>Pendapatan bersih</span>
                  <strong>{formatRupiah(selected.earning)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={blocked}
                onClick={() => {
                  setTakeError("");
                  setConfirming(true);
                }}
              >
                <Icon name="plus" size={16} /> Ambil order ini
              </button>
              {dateTaken(selected) && (
                <p className="field-error" style={{ marginTop: 10 }}>
                  Kamu sudah punya survei di tanggal ini. Pilih order di tanggal lain.
                </p>
              )}
              <p className="hint" style={{ marginTop: 12 }}>
                Dengan mengambil order, kamu berkomitmen hadir sesuai jadwal dan mengirim laporan lengkap. Maks.{" "}
                {data?.maxActive ?? 3} pesanan per surveyor, di tanggal yang berbeda.
                {data ? ` Order berjalan: ${data.activeCount}/${data.maxActive}.` : ""}
              </p>
            </section>
          ) : (
            !loading && (
              <section className="card">
                <p className="muted">Pilih order untuk melihat detailnya.</p>
              </section>
            )
          )}
        </aside>
      </div>

      {confirming && selected && (
        <ConfirmModal
          title="Ambil order ini?"
          description={`#${selected.code} · ${selected.location} · ${formatDate(selected.surveyDate, "long")} ${slotText(
            selected.surveyTimeSlot,
          )}. Pastikan kamu bisa hadir sesuai jadwal.`}
          confirmLabel="Ya, ambil order"
          loading={taking}
          error={takeError}
          onConfirm={take}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}
