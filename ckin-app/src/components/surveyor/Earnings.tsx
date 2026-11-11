"use client";

import { useEffect, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { formatDate, formatRupiah, formatTime, regionLabel } from "@/src/lib/format";
import { HOLD_DAYS, MIN_WITHDRAWAL } from "@/src/lib/survey";
import type { EarningsData } from "@/src/types/surveyor";
import { useApi } from "./shared";

function monthLabel(key: string) {
  if (!key) return "";
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
}

function shortAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (n >= 1000) return `${Math.round(n / 1000)} rb`;
  return n ? String(n) : "0";
}

const WITHDRAW_STATUS = {
  PENDING: { label: "Diproses", tone: "warning" },
  SUCCESS: { label: "Berhasil", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
} as const;

const LIST_BANKS = [
    "Bank BCA",
    "Bank BNI",
    "Bank BRI",
    "Bank Mandiri",
    "Bank BTN",
    "Bank Syariah Indonesia (BSI)",
    "Bank CIMB Niaga",
    "Bank Danamon",
    "Bank Permata",
    "Bank OCBC",
    "Bank Panin",
    "Bank Mega",
    "Bank Maybank Indonesia",
    "Bank Sinarmas",
    "Bank Jago",
    "Bank Neo Commerce",
    "Bank BTPN",
    "Bank HSBC Indonesia",
    "Bank UOB Indonesia",
    "Bank DBS Indonesia",
    "Bank Muamalat",
    "Bank DKI",
    "Bank BJB",
    "Bank Jateng",
    "Bank Jatim",
    "Bank Nagari",
    "Bank Sumut",
    "Bank Kaltimtara",
];

/** Halaman "Penghasilan" surveyor: ringkasan, tren, rincian, tarik dana, riwayat pencairan. */
export default function Earnings() {
  const { user } = useWorkspace();
  const { data, error, loading, reload } = useApi<EarningsData>("/api/surveyor/earnings");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState({ bankName: "", accountNumber: "", accountHolder: "" });
  const [editBank, setEditBank] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!data) return;
    if (data.payoutAccount) setBank(data.payoutAccount);
    else setBank((b) => ({ ...b, accountHolder: b.accountHolder || user?.fullname || "" }));
    setEditBank(!data.payoutAccount);
  }, [data, user?.fullname]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const value = Number(amount.replace(/\D/g, "")) || 0;
  const available = data?.available ?? 0;
  const pending = data?.withdrawals.some((w) => w.status === "PENDING") ?? false;
  const maxTrend = Math.max(1, ...(data?.trend.map((t) => t.amount) ?? [1]));
  const totalRows = data?.rows.reduce((s, r) => s + r.earning, 0) ?? 0;
  const totalKos = data?.rows.reduce((s, r) => s + r.kosCount, 0) ?? 0;
  const prev = data?.trend.at(-2)?.amount ?? 0;
  const growth = prev > 0 && data ? ((data.monthIncome - prev) / prev) * 100 : null;

  async function withdraw() {
    setFormError("");
    if (value < MIN_WITHDRAWAL) return setFormError(`Minimal penarikan ${formatRupiah(MIN_WITHDRAWAL)}.`);
    if (value > available) return setFormError("Nominal melebihi saldo yang dapat ditarik.");
    setSending(true);
    try {
      const res = await apiFetch<{ code: string }>("/api/surveyor/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount: value, ...bank }),
      });
      setAmount("");
      setNotice(`Penarikan #${res.code} diajukan. Admin CKIN memprosesnya dalam 1–2 hari kerja.`);
      await reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Ruang surveyor"
        title="Penghasilan"
        subtitle="Pantau hasil surveimu dan cairkan pendapatan ke rekening pribadi."
        actions={
          <span className="btn btn-secondary" aria-label="Periode">
            <Icon name="calendar" size={16} /> {data ? monthLabel(data.month) : "Bulan ini"}
          </span>
        }
      />

      {error && (
        <div style={{ marginBottom: 20 }}>
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      <section className="stat-grid sv-money-stats">
        <article className="stat-card">
          <div>
            <p className="stat-label">Pendapatan {data ? monthLabel(data.month).split(" ")[0] : "bulan ini"}</p>
            <p className="stat-value">{data ? formatRupiah(data.monthIncome) : "–"}</p>
            <p className="stat-note">Dari {data?.monthKos ?? 0} kos yang disurvei · pendapatan bersih</p>
          </div>
        </article>
        <article className="stat-card dark">
          <div>
            <p className="stat-label">Saldo dapat ditarik</p>
            <p className="stat-value">{data ? formatRupiah(data.available) : "–"}</p>
            <p className="stat-note">Di luar dana tertahan dan dana yang sudah dicairkan</p>
          </div>
        </article>
        <article className="stat-card">
          <div>
            <p className="stat-label">Dana tertahan</p>
            <p className="stat-value">{data ? formatRupiah(data.held) : "–"}</p>
            <p className="stat-note">{data?.heldKos ?? 0} kos · masa review customer ({HOLD_DAYS} hari)</p>
          </div>
        </article>
      </section>

      <div className="two-col">
        <div className="stack">
          <section className="card">
            <h2 className="card-title">Tren pendapatan</h2>
            <p className="card-sub">Total bersih 6 bulan terakhir dari survei yang laporannya sudah dikirim.</p>
            <div className="sv-trend-head">
              <strong>{data ? formatRupiah(data.monthIncome) : "–"}</strong>
              {growth !== null && (
                <StatusPill tone={growth >= 0 ? "success" : "warning"}>
                  {growth >= 0 ? "+" : ""}
                  {growth.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari bulan lalu
                </StatusPill>
              )}
            </div>
            {loading ? (
              <Skeleton height={160} />
            ) : (
              <div className="sv-bars" role="img" aria-label="Grafik pendapatan per bulan">
                {data?.trend.map((t, i) => (
                  <div key={t.key} className="sv-bar-col">
                    <small>{t.amount ? shortAmount(t.amount) : ""}</small>
                    <span
                      className={i === (data.trend.length ?? 0) - 1 ? "current" : ""}
                      style={{ height: `${Math.max(4, (t.amount / maxTrend) * 120)}px` }}
                    />
                    <small>{t.label}</small>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="card-title">Rincian pendapatan survei</h2>
              <p className="card-sub">Rp75.000 bersih per kos · tidak termasuk biaya layanan customer.</p>
            </div>
            <div className="table-wrap">
              <table className="table table-stack">
                <thead>
                  <tr>
                    <th>Pesanan</th>
                    <th>Cakupan</th>
                    <th>Pendapatan</th>
                    <th>Status dana</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={4}>
                        <div className="skeleton" style={{ height: 30 }} />
                      </td>
                    </tr>
                  )}
                  {data?.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="cell-main">
                        <div className="primary">#{r.code}</div>
                        <div className="meta">{formatDate(r.date)}</div>
                      </td>
                      <td data-label="Cakupan">
                        {r.kosCount} kos · {regionLabel(r.district)}
                      </td>
                      <td data-label="Pendapatan">{formatRupiah(r.earning)}</td>
                      <td data-label="Status dana">
                        <StatusPill tone={r.state === "Tersedia" ? "success" : "warning"}>{r.state}</StatusPill>
                        {r.releaseAt && <div className="meta">Dilepas {formatDate(r.releaseAt)}</div>}
                      </td>
                    </tr>
                  ))}
                  {data && data.rows.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty">Belum ada pendapatan. Kirim laporan survei pertamamu.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {data && data.rows.length > 0 && (
              <div className="table-foot">
                <span>Total · {totalKos} kos</span>
                <strong className="sv-total">{formatRupiah(totalRows)}</strong>
              </div>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="card">
            <h2 className="card-title">Tarik dana</h2>
            <p className="card-sub">Saldo tersedia untuk ditarik {formatRupiah(available)}.</p>

            {!editBank && data?.payoutAccount ? (
              <div className="sv-bank">
                <Icon name="bank" size={20} />
                <div>
                  <strong>{bank.bankName}</strong>
                  <small>
                    •••• {bank.accountNumber.slice(-4)} · {bank.accountHolder}
                  </small>
                  <button type="button" className="text-link" onClick={() => setEditBank(true)}>
                    Ubah rekening
                  </button>
                </div>
              </div>
            ) : (
              <div className="stack" style={{ gap: 12, margin: "16px 0" }}>
                <div className="field">
                    <label className="label" htmlFor="bank-name">
                      Nama bank
                    </label>
                    <select
                      id="bank-name"
                      className="input"
                      value={bank.bankName}
                      onChange={(e) =>setBank({...bank,bankName: e.target.value,})}
                    >
                      <option value="" disabled>
                        Pilih bank
                      </option>
                      {LIST_BANKS.map((bankName) => (
                        <option key={bankName} value={bankName}>
                          {bankName}
                        </option>
                      ))}
                    </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="bank-number">
                    Nomor rekening
                  </label>
                  <input
                    id="bank-number"
                    className="input"
                    inputMode="numeric"
                    value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 20) })}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="bank-holder">
                    Nama pemilik rekening
                  </label>
                  <input
                    id="bank-holder"
                    className="input"
                    value={bank.accountHolder}
                    onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="wd-amount">
                Nominal penarikan
              </label>
              <div className="sv-money">
                <span>Rp</span>
                <input
                  id="wd-amount"
                  className="input"
                  inputMode="numeric"
                  placeholder="500.000"
                  value={value ? value.toLocaleString("id-ID") : ""}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
              <p className="hint">
                Minimum {formatRupiah(MIN_WITHDRAWAL)} · Maksimum {formatRupiah(available)}
              </p>
            </div>

            <div className="sv-kv">
              <div>
                <span>Nominal</span>
                <strong>{formatRupiah(value)}</strong>
              </div>
              <div>
                <span>Biaya transfer</span>
                <strong>{formatRupiah(0)}</strong>
              </div>
            </div>
            <div className="sv-earn">
              <div className="total">
                <span>Dana diterima</span>
                <strong>{formatRupiah(value)}</strong>
              </div>
            </div>

            {formError && (
              <p className="field-error" role="alert" style={{ marginBottom: 10 }}>
                {formError}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={sending || pending || available < MIN_WITHDRAWAL}
              onClick={withdraw}
            >
              {sending ? <span className="spinner" /> : <Icon name="arrowUpRight" size={16} />} Tarik dana ke rekening
            </button>
            <p className="hint" style={{ marginTop: 10 }}>
              {pending
                ? "Masih ada penarikan yang sedang diproses admin CKIN."
                : "Diproses admin CKIN dalam 1–2 hari kerja. Pastikan rekening atas nama sendiri."}
            </p>
          </section>

          <section className="card">
            <h2 className="card-title">Riwayat pencairan</h2>
            {data && data.withdrawals.length === 0 && <p className="muted" style={{ marginTop: 12 }}>Belum ada pencairan.</p>}
            {data?.withdrawals.map((w) => {
              const st = WITHDRAW_STATUS[w.status];
              return (
                <div key={w.id} className="sv-wd">
                  <div className="sv-wd-top">
                    <strong>{formatRupiah(w.amount)}</strong>
                    <StatusPill tone={st.tone}>{st.label}</StatusPill>
                  </div>
                  <small>
                    {formatDate(w.createdAt)} · {w.bankName} •••• {w.accountTail}
                  </small>
                  <small>
                    #{w.code} · Diajukan {formatTime(w.createdAt)} WIB
                    {w.processedAt ? ` · Diproses ${formatDate(w.processedAt)}` : ""}
                  </small>
                  {w.status === "REJECTED" && w.note && <small className="danger-text">Alasan: {w.note}. Dana kembali ke saldo.</small>}
                </div>
              );
            })}
          </section>

          <div className="alert alert-success">
            <Icon name="info" size={18} />
            <div>
              <strong>Apa itu dana tertahan?</strong>
              Pendapatan dari laporan yang sudah kamu kirim, tetapi masih dalam masa review customer. Dana pindah ke
              saldo dapat ditarik saat customer memberi ulasan, atau otomatis {HOLD_DAYS} hari setelah laporan dikirim.
              Order yang masih berjalan belum dihitung.
            </div>
          </div>
        </aside>
      </div>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
