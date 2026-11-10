"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ErrorState, PageHeader, StatusPill } from "@/src/components/ui/common";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { firstName, formatDate, formatRupiah } from "@/src/lib/format";
import { surveyorTab, type SurveyorTab } from "@/src/lib/survey";
import type { SurveyorOrderCard } from "@/src/types/surveyor";
import { dateKey, slotText, useApi } from "./shared";

const PAGE_SIZE = 8;

const TABS: Array<{ value: SurveyorTab; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "scheduled", label: "Terjadwal" },
  { value: "progress", label: "Dalam proses" },
  { value: "review", label: "Menunggu review" },
  { value: "done", label: "Selesai" },
];

function actionFor(order: SurveyorOrderCard) {
  if (order.status === "REPORT_SUBMITTED" || order.status === "COMPLETED") {
    return { label: "Lihat laporan", href: `/surveyor/orders/${order.id}` };
  }
  return { label: "Kelola survei", href: `/surveyor/orders/${order.id}` };
}

/** Tabel order milik surveyor — dipakai di halaman Order survei & dashboard. */
export function SurveyorOrdersTable({
  orders,
  loading,
  emptyText = "Belum ada order pada kategori ini.",
  compact = false,
}: {
  orders: SurveyorOrderCard[];
  loading?: boolean;
  emptyText?: string;
  /** Versi ringkas (dashboard): kolom lokasi digabung ke kolom customer. */
  compact?: boolean;
}) {
  const cols = compact ? 5 : 6;
  return (
    <div className="table-wrap">
      <table className="table sv-table table-stack">
        <thead>
          <tr>
            <th>Customer / pesanan</th>
            {!compact && <th>Lokasi</th>}
            <th>Jadwal survei</th>
            <th>Status</th>
            <th>Pendapatan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`s-${i}`}>
                <td colSpan={cols}>
                  <div className="skeleton" style={{ height: 34 }} />
                </td>
              </tr>
            ))}
          {!loading &&
            orders.map((o) => {
              const action = actionFor(o);
              return (
                <tr key={o.id} className={o.status === "IN_PROGRESS" ? "highlight" : ""}>
                  <td className="cell-main">
                    <div className="primary">{o.customer.name}</div>
                    <div className="meta">#{o.code}</div>
                    {compact ? (
                      <div className="meta">
                        {o.location} · {o.kosCount} kos
                      </div>
                    ) : (
                      <div className="meta paid">Sudah dibayar</div>
                    )}
                  </td>
                  {!compact && (
                    <td data-label="Lokasi">
                      <div>{o.location}</div>
                      <div className="meta">{o.kosCount} kos</div>
                    </td>
                  )}
                  <td data-label="Jadwal survei">
                    <div>{formatDate(o.surveyDate)}</div>
                    <div className="meta">{slotText(o.surveyTimeSlot)}</div>
                  </td>
                  <td data-label="Status">
                    <StatusPill tone={o.statusTone}>{o.statusLabel}</StatusPill>
                  </td>
                  <td data-label="Pendapatan">{formatRupiah(o.earning)}</td>
                  <td data-label="Aksi">
                    <Link className="table-action" href={action.href}>
                      {action.label} →
                    </Link>
                  </td>
                </tr>
              );
            })}
          {!loading && orders.length === 0 && (
            <tr>
              <td colSpan={cols}>
                <div className="empty">{emptyText}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function weekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const end = new Date(start.getTime() + 6 * 86400000);
  return [dateKey(start.toISOString()), dateKey(end.toISOString())];
}

/** Halaman "Order survei" — semua order yang sudah diambil surveyor. */
export default function MyOrders() {
  const { user } = useWorkspace();
  const { data, error, loading, reload } = useApi<{ orders: SurveyorOrderCard[] }>("/api/surveyor/orders");
  const [tab, setTab] = useState<SurveyorTab>("all");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const orders = useMemo(() => data?.orders ?? [], [data]);

  const counts = useMemo(() => {
    const c: Record<SurveyorTab, number> = { all: 0, scheduled: 0, progress: 0, review: 0, done: 0 };
    for (const o of orders) {
      const t = surveyorTab(o.status);
      if (!t) continue;
      c.all += 1;
      c[t] += 1;
    }
    return c;
  }, [orders]);

  const stats = useMemo(() => {
    const [ws, we] = weekRange();
    const active = orders.filter((o) => o.status === "ASSIGNED" || o.status === "IN_PROGRESS");
    return {
      active: active.length,
      week: active.filter((o) => dateKey(o.surveyDate) >= ws && dateKey(o.surveyDate) <= we).length,
      review: counts.review,
    };
  }, [orders, counts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const t = surveyorTab(o.status);
      if (!t) return false;
      if (tab !== "all" && t !== tab) return false;
      if (date && dateKey(o.surveyDate) !== date) return false;
      if (q && !o.customer.name.toLowerCase().includes(q) && !o.code.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, tab, query, date]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Ruang surveyor"
        title="Order survei"
        subtitle="Semua order yang sudah kamu ambil, dari jadwal kunjungan hingga laporan selesai."
        actions={
          <Link href="/surveyor/open-orders" className="btn btn-secondary">
            <Icon name="plus" size={16} /> Cari order baru
          </Link>
        }
      />

      <section className="stat-grid" aria-label="Ringkasan order">
        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="clipboard" size={20} />
          </div>
          <div>
            <p className="stat-value">{loading ? "–" : stats.active}</p>
            <p className="stat-label">Order berjalan</p>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="calendar" size={20} />
          </div>
          <div>
            <p className="stat-value">{loading ? "–" : stats.week}</p>
            <p className="stat-label">Survei minggu ini</p>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="report" size={20} />
          </div>
          <div>
            <p className="stat-value">{loading ? "–" : stats.review}</p>
            <p className="stat-label">Laporan menunggu review</p>
          </div>
        </article>
      </section>

      {error && (
        <div style={{ marginBottom: 20 }}>
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      <section className="panel">
        <div className="panel-head">
          <div className="sv-search-row">
            <label className="input-wrap grow">
              <Icon name="search" size={16} />
              <input
                className="input"
                placeholder="Cari nama customer atau nomor pesanan…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="sv-date">
              <Icon name="calendar" size={15} />
              <input
                type="date"
                value={date}
                aria-label="Filter tanggal survei"
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
              />
              {date ? (
                <button type="button" className="text-link" onClick={() => setDate("")}>
                  Semua tanggal
                </button>
              ) : null}
            </label>
          </div>
          <div className="tabs sv-tabs" role="tablist" aria-label="Filter status">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                className={`tab ${tab === t.value ? "active" : ""}`}
                onClick={() => {
                  setTab(t.value);
                  setPage(1);
                }}
              >
                {t.label}
                <span className="count">{loading ? "" : counts[t.value]}</span>
              </button>
            ))}
          </div>
        </div>

        <SurveyorOrdersTable
          orders={visible}
          loading={loading}
          emptyText={
            orders.length === 0 ? "Kamu belum mengambil order. Cari order di menu Order tersedia." : "Tidak ada order yang cocok."
          }
        />

        <div className="table-foot sv-pager">
          <span>
            Menampilkan {visible.length} dari {filtered.length} order milik {firstName(user?.fullname) || "kamu"}
          </span>
          <div className="sv-pages">
            <button type="button" className="btn btn-secondary btn-sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              Sebelumnya
            </button>
            <span className="sv-page-num">{current}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>

      <div className="alert alert-success" style={{ marginTop: 20 }}>
        <Icon name="clipboard" size={18} />
        <div>
          <strong>Perbarui progres setelah setiap kunjungan</strong>
          Lengkapi checklist dan bukti foto, lalu kirim laporan agar customer dapat meninjau hasil surveimu.
        </div>
      </div>
    </>
  );
}
