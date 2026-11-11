"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ConfirmModal, EmptyState, ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { useApi } from "@/src/components/surveyor/shared";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { formatDate, formatDateTime, formatRupiah, initials, regionLabel } from "@/src/lib/format";
import type { AdminOverview, AdminSurveyorRow, AdminWithdrawalRow } from "@/src/types/admin";

const VERIFY_TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const;
const VERIFY_LABEL = { PENDING: "Menunggu verifikasi", APPROVED: "Terverifikasi", REJECTED: "Ditolak" } as const;
const WD_TONE = { PENDING: "warning", SUCCESS: "success", REJECTED: "danger" } as const;
const WD_LABEL = { PENDING: "Menunggu diproses", SUCCESS: "Sudah ditransfer", REJECTED: "Ditolak" } as const;

/** Dashboard super admin: ringkasan pekerjaan yang perlu ditindaklanjuti. */
export function AdminHome() {
  const { data, error, reload } = useApi<AdminOverview>("/api/admin/overview");
  const cards = [
    { label: "Surveyor menunggu verifikasi", value: data?.pendingSurveyors, icon: "shield" as const, href: "/admin/surveyors" },
    {
      label: "Penarikan dana menunggu",
      value: data?.pendingWithdrawals,
      note: data ? formatRupiah(data.pendingWithdrawalAmount) : "",
      icon: "wallet" as const,
      href: "/admin/withdrawals",
    },
    { label: "Order aktif", value: data?.activeOrders, icon: "clipboard" as const },
    { label: "Surveyor terverifikasi", value: data?.approvedSurveyors, icon: "checkCircle" as const },
    { label: "Customer terdaftar", value: data?.customers, icon: "user" as const },
    { label: "Pendapatan biaya layanan", value: data ? formatRupiah(data.serviceRevenue) : undefined, icon: "trend" as const },
  ];
  return (
    <>
      <PageHeader eyebrow="Super admin" title="Ringkasan CKIN" subtitle="Verifikasi mitra surveyor dan proses pencairan dana dari satu tempat." />
      {error && <ErrorState message={error} onRetry={reload} />}
      <section className="admin-grid">
        {cards.map((c) => {
          const body = (
            <>
              <div className="stat-icon">
                <Icon name={c.icon} size={20} />
              </div>
              <div>
                <p className="stat-label">{c.label}</p>
                <p className="stat-value">{c.value ?? "–"}</p>
                {c.note && <p className="stat-note">{c.note}</p>}
              </div>
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="stat-card admin-link">
              {body}
              <Icon name="arrowUpRight" size={16} className="admin-go" />
            </Link>
          ) : (
            <article key={c.label} className="stat-card">
              {body}
            </article>
          );
        })}
      </section>
      <div className="alert alert-info" style={{ marginTop: 20 }}>
        <Icon name="info" size={18} />
        <div>
          <strong>Alur kerja admin</strong>
          Surveyor baru berstatus menunggu verifikasi dan belum bisa mengambil order. Periksa KTP &amp; selfie lalu
          setujui. Pengajuan tarik dana surveyor ditransfer manual ke rekening, lalu tandai &quot;Sudah ditransfer&quot;.
        </div>
      </div>
    </>
  );
}

/** Verifikasi akun surveyor (KTP, selfie, domisili, area jangkauan). */
export function AdminSurveyors() {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const { data, error, loading, reload } = useApi<{ surveyors: AdminSurveyorRow[] }>(`/api/admin/surveyors?status=${status}`);
  const [target, setTarget] = useState<{ row: AdminSurveyorRow; action: "APPROVED" | "REJECTED" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function submit() {
    if (!target) return;
    setBusy(true);
    setActionError("");
    try {
      await apiFetch(`/api/admin/surveyors/${target.row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: target.action, reason }),
      });
      setTarget(null);
      setReason("");
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Super admin" title="Verifikasi surveyor" subtitle="Hanya surveyor terverifikasi yang dapat mengambil order." />
      <div className="tabs tabs-scroll" style={{ marginBottom: 20 }}>
        {(
          [
            ["PENDING", "Menunggu"],
            ["APPROVED", "Terverifikasi"],
            ["REJECTED", "Ditolak"],
            ["ALL", "Semua"],
          ] as const
        ).map(([v, label]) => (
          <button key={v} type="button" className={`tab ${status === v ? "active" : ""}`} onClick={() => setStatus(v)}>
            {label}
          </button>
        ))}
      </div>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && <Skeleton height={160} />}
      {!loading && data?.surveyors.length === 0 && (
        <div className="card">
          <EmptyState title="Tidak ada surveyor" description="Belum ada akun pada status ini." />
        </div>
      )}
      <div className="admin-cards">
        {data?.surveyors.map((s) => (
          <article key={s.id} className="card admin-card">
            <div className="admin-card-head">
              <span className="avatar">{initials(s.fullname)}</span>
              <div className="grow">
                <strong>{s.fullname}</strong>
                <small>
                  {s.email} · {s.phone}
                </small>
              </div>
              <StatusPill tone={VERIFY_TONE[s.status]}>{VERIFY_LABEL[s.status]}</StatusPill>
            </div>
            <div className="sv-kv">
              <div>
                <span>Domisili</span>
                <strong>{regionLabel(s.domicile)}</strong>
              </div>
              <div>
                <span>Area jangkauan</span>
                <strong>{s.coverage.map((d) => regionLabel(d)).join(", ") || "-"}</strong>
              </div>
              <div>
                <span>Mendaftar</span>
                <strong>{formatDate(s.createdAt)}</strong>
              </div>
              {s.status === "APPROVED" && (
                <div>
                  <span>Rating</span>
                  <strong>
                    {s.rating.average.toLocaleString("id-ID", { maximumFractionDigits: 1 })} ({s.rating.count} ulasan)
                  </strong>
                </div>
              )}
            </div>
            {s.experience && <p className="muted sv-par wrap-break-word">{s.experience}</p>}
            {s.rejectionReason && <p className="danger-text sv-par">Alasan ditolak: {s.rejectionReason}</p>}
            <div className="admin-docs">
              {s.ktpUrl ? (
                <a href={s.ktpUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                  <Icon name="image" size={15} /> Foto KTP
                </a>
              ) : (
                <span className="muted">KTP tidak tersedia</span>
              )}
              {s.selfieUrl ? (
                <a href={s.selfieUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                  <Icon name="user" size={15} /> Selfie dengan KTP
                </a>
              ) : (
                <span className="muted">Selfie tidak tersedia</span>
              )}
            </div>
            <div className="admin-actions">
              {s.status !== "APPROVED" && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setTarget({ row: s, action: "APPROVED" })}>
                  <Icon name="check" size={15} /> Setujui
                </button>
              )}
              {s.status !== "REJECTED" && (
                <button type="button" className="btn-ghost-danger" onClick={() => setTarget({ row: s, action: "REJECTED" })}>
                  {s.status === "APPROVED" ? "Cabut verifikasi" : "Tolak"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {target && (
        <ConfirmModal
          title={target.action === "APPROVED" ? `Setujui ${target.row.fullname}?` : `Tolak ${target.row.fullname}?`}
          description={
            target.action === "APPROVED"
              ? "Surveyor langsung bisa mengambil order di area jangkauannya."
              : "Surveyor tidak bisa mengambil order. Alasan akan terlihat di akunnya."
          }
          confirmLabel={target.action === "APPROVED" ? "Ya, setujui" : "Tolak akun"}
          loading={busy}
          error={actionError}
          onConfirm={submit}
          onClose={() => {
            setTarget(null);
            setActionError("");
          }}
        >
          {target.action === "REJECTED" && (
            <textarea
              className="textarea"
              rows={3}
              placeholder="Alasan penolakan, mis. foto KTP buram"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ marginTop: 14 }}
            />
          )}
        </ConfirmModal>
      )}
    </>
  );
}

/** Proses pengajuan tarik dana surveyor. */
export function AdminWithdrawals() {
  const [status, setStatus] = useState<"PENDING" | "SUCCESS" | "REJECTED" | "ALL">("PENDING");
  const { data, error, loading, reload } = useApi<{ withdrawals: AdminWithdrawalRow[] }>(`/api/admin/withdrawals?status=${status}`);
  const [target, setTarget] = useState<{ row: AdminWithdrawalRow; action: "SUCCESS" | "REJECTED" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const total = data?.withdrawals.reduce((s, w) => s + w.amount, 0) ?? 0;

  async function submit() {
    if (!target) return;
    setBusy(true);
    setActionError("");
    try {
      await apiFetch(`/api/admin/withdrawals/${target.row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: target.action, note }),
      });
      setTarget(null);
      setNote("");
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="Penarikan dana"
        subtitle="Transfer ke rekening surveyor, lalu tandai sudah ditransfer. Penolakan mengembalikan dana ke saldo surveyor."
      />
      <div className="tabs tabs-scroll" style={{ marginBottom: 20 }}>
        {(
          [
            ["PENDING", "Menunggu"],
            ["SUCCESS", "Sudah ditransfer"],
            ["REJECTED", "Ditolak"],
            ["ALL", "Semua"],
          ] as const
        ).map(([v, label]) => (
          <button key={v} type="button" className={`tab ${status === v ? "active" : ""}`} onClick={() => setStatus(v)}>
            {label}
          </button>
        ))}
      </div>
      {error && <ErrorState message={error} onRetry={reload} />}

      <section className="panel">
        <div className="table-wrap">
          <table className="table table-stack">
            <thead>
              <tr>
                <th>Pengajuan</th>
                <th>Surveyor</th>
                <th>Rekening tujuan</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="skeleton" style={{ height: 34 }} />
                  </td>
                </tr>
              )}
              {!loading &&
                data?.withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="cell-main">
                      <div className="primary">#{w.code}</div>
                      <div className="meta">{formatDateTime(w.createdAt)}</div>
                    </td>
                    <td data-label="Surveyor">
                      <div>{w.surveyor.name}</div>
                      <div className="meta">{w.surveyor.email}</div>
                    </td>
                    <td data-label="Rekening tujuan">
                      <div>{w.bank.bankName}</div>
                      <div className="meta">
                        {w.bank.accountNumber} · {w.bank.accountHolder}
                      </div>
                    </td>
                    <td data-label="Nominal">
                      <strong>{formatRupiah(w.amount)}</strong>
                    </td>
                    <td data-label="Status">
                      <StatusPill tone={WD_TONE[w.status]}>{WD_LABEL[w.status]}</StatusPill>
                      {w.note && <div className="meta">{w.note}</div>}
                    </td>
                    <td data-label="Aksi">
                      {w.status === "PENDING" ? (
                        <div className="admin-actions">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => setTarget({ row: w, action: "SUCCESS" })}>
                            Sudah ditransfer
                          </button>
                          <button type="button" className="btn-ghost-danger" onClick={() => setTarget({ row: w, action: "REJECTED" })}>
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="meta">{w.processedAt ? formatDate(w.processedAt) : "-"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              {!loading && data?.withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">Tidak ada pengajuan pada status ini.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && (data?.withdrawals.length ?? 0) > 0 && (
          <div className="table-foot">
            <span>{data?.withdrawals.length} pengajuan</span>
            <strong className="sv-total">{formatRupiah(total)}</strong>
          </div>
        )}
      </section>

      {target && (
        <ConfirmModal
          title={target.action === "SUCCESS" ? "Tandai sudah ditransfer?" : "Tolak penarikan?"}
          description={
            target.action === "SUCCESS"
              ? `Pastikan ${formatRupiah(target.row.amount)} sudah ditransfer ke ${target.row.bank.bankName} ${target.row.bank.accountNumber} a.n. ${target.row.bank.accountHolder}.`
              : "Dana kembali ke saldo surveyor dan alasan penolakan terlihat di halaman penghasilannya."
          }
          confirmLabel={target.action === "SUCCESS" ? "Ya, sudah ditransfer" : "Tolak penarikan"}
          loading={busy}
          error={actionError}
          onConfirm={submit}
          onClose={() => {
            setTarget(null);
            setActionError("");
          }}
        >
          {target.action === "REJECTED" && (
            <textarea
              className="textarea"
              rows={3}
              placeholder="Alasan, mis. nama rekening tidak sesuai"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ marginTop: 14 }}
            />
          )}
        </ConfirmModal>
      )}
    </>
  );
}
