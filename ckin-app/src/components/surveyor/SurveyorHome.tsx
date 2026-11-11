"use client";

import Link from "next/link";
import Icon from "@/src/components/ui/Icon";
import { ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { firstName, formatRupiah, initials, regionLabel, shortCity } from "@/src/lib/format";
import type { SurveyorDashboardData } from "@/src/types/surveyor";
import { SurveyorOrdersTable } from "./MyOrders";
import { budgetShort, dayMonth, genderLabel, slotText, useApi } from "./shared";
import { useEffect, useState } from "react";

// function greeting() {
//   const hour = Number(
//     new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Jakarta" }),
//   );
//   if (hour < 11) return "Selamat pagi";
//   if (hour < 15) return "Selamat siang";
//   if (hour < 18) return "Selamat sore";
//   return "Selamat malam";
// }

/**
 * Dashboard surveyor.
 * Bagian akun, verifikasi, domisili & area jangkauan = Anggota 1.
 * Statistik order, order tersedia & order berjalan = Anggota 3.
 */
export default function SurveyorHome() {
  const { user, loading } = useWorkspace();
  const [greeting, setGreeting] = useState<string>()
  const dash = useApi<SurveyorDashboardData>("/api/surveyor/dashboard");
  const d = dash.data;
  const status = user?.verificationStatus ?? "PENDING";

  useEffect(() => {
    const hour = Number(
      new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Jakarta" }),
    );
    const greet = () => {
      if (hour < 11) return "Selamat pagi";
      if (hour < 15) return "Selamat siang";
      if (hour < 18) return "Selamat sore";
      return "Selamat malam";
    }

    setGreeting(greet)
  })

  return (
    <>
      <PageHeader
        eyebrow="Ruang surveyor"
        title={`${greeting}, ${firstName(user?.fullname) || "Surveyor"}. Siap bantu hari ini?`}
        subtitle="Temukan order di sekitarmu dan kelola setiap survei dengan rapi."
        actions={
          user && (
            <StatusPill tone={user.acceptingOrders === false ? "muted" : "success"}>
              {user.acceptingOrders === false ? "Tidak menerima order" : "Aktif menerima order"}
            </StatusPill>
          )
        }
      />

      {status === "PENDING" && (
        <div className="alert alert-warning" style={{ marginBottom: 22 }}>
          <Icon name="shield" size={18} />
          <div>
            <strong>Akunmu sedang ditinjau tim CKIN</strong>
            Kamu baru dapat mengambil order setelah data dan dokumen identitas disetujui (1–3 hari
            kerja). Hasil verifikasi dikirim lewat email.
          </div>
        </div>
      )}
      {status === "REJECTED" && (
        <div className="alert alert-danger" style={{ marginBottom: 22 }}>
          <Icon name="alert" size={18} />
          <div>
            <strong>Pendaftaran mitra belum disetujui</strong>
            {user?.rejectionReason ?? "Hubungi bantuan CKIN untuk informasi lebih lanjut."}
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="stack">
          {dash.error && <ErrorState message={dash.error} onRetry={dash.reload} />}

          <section className="stat-grid" style={{ marginBottom: 0 }} aria-label="Ringkasan surveyor">
            <article className="stat-card">
              <div className="stat-icon">
                <Icon name="clipboard" size={20} />
              </div>
              <div>
                <p className="stat-label">Order berjalan</p>
                <p className="stat-value">{d ? d.activeCount : "–"}</p>
                <p className="stat-note">{d ? `${d.weekCount} survei minggu ini` : "Memuat…"}</p>
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-icon">
                <Icon name="pin" size={20} />
              </div>
              <div>
                <p className="stat-label">Order tersedia</p>
                <p className="stat-value">{d ? d.openCount : "–"}</p>
                <p className="stat-note">Di area jangkauanmu</p>
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-icon">
                <Icon name="wallet" size={20} />
              </div>
              <div>
                <p className="stat-label">Pendapatan bulan ini</p>
                <p className="stat-value">{d ? formatRupiah(d.monthIncome) : "–"}</p>
                <p className="stat-note">
                  <Link href="/surveyor/earnings">{d ? `${d.monthKos} kos · lihat rincian ↗` : "Lihat rincian ↗"}</Link>
                </p>
              </div>
            </article>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Order tersedia di sekitarmu</h2>
                <p className="card-sub">Order terbayar yang belum diambil surveyor lain.</p>
              </div>
              <Link className="btn btn-secondary btn-sm" href="/surveyor/open-orders">
                <Icon name="arrowUpRight" size={15} /> Lihat semua
              </Link>
            </div>
            {dash.loading && <Skeleton height={120} />}
            {d && d.openOrders.length === 0 && (
              <p className="muted" style={{ marginTop: 14 }}>
                Belum ada order baru di areamu. Order muncul setelah customer menyelesaikan pembayaran.
              </p>
            )}
            <div className="sv-mini-list">
              {d?.openOrders.map((o) => (
                <Link key={o.id} href="/surveyor/open-orders" className="sv-mini">
                  <span className="avatar sm">{initials(o.customer.name)}</span>
                  <div className="grow">
                    <strong>{o.location}</strong>
                    <small>
                      {genderLabel(o.requirements.genderPreferences)} · {budgetShort(o.requirements.budget)} · {o.kosCount} kos
                    </small>
                  </div>
                  <div className="end">
                    <strong>{formatRupiah(o.earning)}</strong>
                    <small>
                      {dayMonth(o.surveyDate)} · {slotText(o.surveyTimeSlot)}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div className="row">
                <div>
                  <h2 className="card-title">Order survei terbaru</h2>
                  <p className="card-sub">Order yang sedang dan sudah kamu kerjakan.</p>
                </div>
                <Link className="btn btn-secondary btn-sm" href="/surveyor/orders">
                  <Icon name="arrowUpRight" size={15} /> Semua order
                </Link>
              </div>
            </div>
            <SurveyorOrdersTable
              orders={d?.recentOrders ?? []}
              loading={dash.loading}
              compact
              emptyText="Belum ada order. Ambil order pertamamu di menu Order tersedia."
            />
          </section>
        </div>

        <aside className="stack">
          <section className="card area-card">
            <h2 className="card-title" style={{ marginBottom: 20 }}>
              Domisili &amp; jangkauan
            </h2>
            {loading || !user ? (
              <Skeleton height={120} />
            ) : (
              <>
                <div className="loc">
                  <Icon name="pin" size={20} />
                  <div>
                    <strong>
                      {regionLabel(user.domicile?.district)}, {shortCity(user.domicile?.city)}
                    </strong>
                    <small>
                      {shortCity(user.domicile?.city)}, {regionLabel(user.domicile?.province)}
                    </small>
                  </div>
                </div>
                <p className="label-sm">Area jangkauan aktif</p>
                <div className="tag-row">
                  {(user.coverageArea?.districts ?? []).map((d) => (
                    <span className="chip" key={d}>
                      {regionLabel(d)}
                    </span>
                  ))}
                </div>
                <p className="hint" style={{ marginBottom: 18 }}>
                  Order dicocokkan dengan domisili dan area yang kamu pilih, bukan seluruh kota.
                </p>
                <Link href="/surveyor/settings" className="btn btn-secondary btn-block">
                  <Icon name="sliders" size={16} /> Atur jangkauan
                </Link>
              </>
            )}
          </section>

          <section className="rating-card">
            <Icon name="star" size={24} />
            <div>
              <strong>
                {user?.rating && user.rating.count > 0
                  ? `${user.rating.average.toLocaleString("id-ID")} dari 5`
                  : "Belum ada rating"}
              </strong>
              <small>
                {user?.rating?.count ? `${user.rating.count} ulasan customer` : "Rating muncul setelah ulasan pertama"}
              </small>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
