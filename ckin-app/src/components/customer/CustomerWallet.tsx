"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { formatDate, formatRupiah, formatTime } from "@/src/lib/format";
import { TOPUP_ADMIN_FEE, TOPUP_MAX, TOPUP_MIN, TOPUP_PRESETS } from "@/src/lib/pricing";
import type { WalletView } from "@/src/types/customer";

type Trx = WalletView["transactions"][number];
type Filter = "all" | "topup" | "payment" | "refund";

const METHODS = [
  { id: "bank", label: "Virtual Account", note: "BCA, BNI, BRI, Mandiri, Permata", icon: "bank" as const },
  { id: "qris", label: "QRIS", note: "Semua aplikasi bank & e-wallet", icon: "qr" as const },
  { id: "ewallet", label: "E-wallet", note: "GoPay, ShopeePay", icon: "wallet" as const },
];
const STATUS = {
  SUCCESS: { label: "Berhasil", tone: "success" as const },
  PENDING: { label: "Menunggu bayar", tone: "warning" as const },
  FAILED: { label: "Gagal", tone: "danger" as const },
};
const FILTERS: Array<[Filter, string]> = [
  ["all", "Semua"],
  ["topup", "Top up"],
  ["payment", "Pembayaran"],
  ["refund", "Refund"],
];

function trxIcon(trx: Trx) {
  if (trx.category === "refund") return "refresh" as const;
  if (trx.category === "topup") return "arrowDownLeft" as const;
  return "arrowUpRight" as const;
}

/** Saldo CKIN customer: top up via Midtrans (+ biaya admin), refund, dan riwayat semua transaksi. */
export default function CustomerWallet() {
  const { user } = useWorkspace();
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [amount, setAmount] = useState(100000);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState("bank");
  const [paying, setPaying] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "info" | "danger"; text: string } | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setWallet(await apiFetch<WalletView>("/api/customer/wallet"));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  // Kembali dari Midtrans: ?topup=<id> → cek status langsung ke Midtrans.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topupId = params.get("topup");
    if (!topupId) {
      void load();
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    apiFetch<{ status: Trx["status"] }>("/api/customer/wallet/topup/sync", {
      method: "POST",
      body: JSON.stringify({ id: topupId }),
    })
      .then(({ status }) =>
        setNotice(
          status === "SUCCESS"
            ? { tone: "success", text: "Top up berhasil. Saldo sudah bertambah." }
            : status === "FAILED"
              ? { tone: "danger", text: "Top up gagal atau dibatalkan." }
              : { tone: "info", text: "Pembayaran top up sedang diproses Midtrans. Saldo bertambah otomatis setelah terkonfirmasi." },
        ),
      )
      .catch(() => undefined)
      .finally(() => void load());
  }, [load]);

  const rows = useMemo(
    () => (wallet?.transactions ?? []).filter((t) => filter === "all" || t.category === filter),
    [wallet, filter],
  );

  const value = custom ? Number(custom) : amount;
  const total = value + TOPUP_ADMIN_FEE;

  async function topup() {
    setFormError("");
    if (!value || value < TOPUP_MIN) return setFormError(`Minimal top up ${formatRupiah(TOPUP_MIN)}.`);
    if (value > TOPUP_MAX) return setFormError(`Maksimal top up ${formatRupiah(TOPUP_MAX)}.`);
    setPaying(true);
    try {
      const res = await apiFetch<{ redirectUrl: string }>("/api/customer/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ amount: value, method }),
      });
      window.location.href = res.redirectUrl;
    } catch (err) {
      setFormError(errorMessage(err));
      setPaying(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Ruang pengguna"
        title="Saldo saya"
        subtitle="Siapkan saldo untuk survei berikutnya. Semua transaksi tercatat di sini."
        actions={
          <a className="btn btn-primary" href="#topup">
            <Icon name="plus" size={16} /> Top up saldo
          </a>
        }
      />

      {error && (
        <div style={{ marginBottom: 20 }}>
          <ErrorState message={error} onRetry={load} />
        </div>
      )}
      {notice && (
        <div className={`alert alert-${notice.tone}`} style={{ marginBottom: 20 }} role="status">
          <Icon name={notice.tone === "success" ? "checkCircle" : notice.tone === "danger" ? "alert" : "info"} size={18} />
          <span>{notice.text}</span>
        </div>
      )}

      <div className="two-col">
        <div className="stack">
          <section className="balance-card">
            <div className="top">
              <span>
                <Icon name="wallet" size={18} /> Saldo tersedia
              </span>
              <span className="owner">{user?.fullname}</span>
            </div>
            <p className="amount">{wallet ? formatRupiah(wallet.balance) : "Rp–"}</p>
            <div className="balance-split">
              <span>
                Total masuk <strong>{wallet ? formatRupiah(wallet.totalIn) : "–"}</strong>
              </span>
              <span>
                Total terpakai <strong>{wallet ? formatRupiah(wallet.totalOut) : "–"}</strong>
              </span>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Riwayat transaksi</h2>
            <p className="card-sub">
              Top up, pembayaran survei (saldo maupun Midtrans), dan refund pesanan yang dibatalkan.
            </p>
            <div className="tabs tabs-scroll" style={{ margin: "22px 0 6px" }}>
              {FILTERS.map(([v, label]) => (
                <button key={v} type="button" className={`tab ${filter === v ? "active" : ""}`} onClick={() => setFilter(v)}>
                  {label}
                </button>
              ))}
            </div>

            {!wallet && !error && (
              <div className="stack" style={{ marginTop: 16 }}>
                <Skeleton height={48} />
                <Skeleton height={48} />
              </div>
            )}

            {wallet && rows.length === 0 && (
              <div className="empty">
                <strong>Belum ada transaksi</strong>
                Top up, pembayaran survei, dan refund akan tercatat di sini.
              </div>
            )}

            {rows.map((trx) => (
              <div className={`trx ${trx.category}`} key={trx.id}>
                <span className="ic">
                  <Icon name={trxIcon(trx)} size={16} />
                </span>
                <div className="body">
                  <strong>{trx.description}</strong>
                  <small>
                    {formatDate(trx.createdAt)} {formatTime(trx.createdAt)}
                    {trx.reference ? ` · ${trx.reference}` : ""}
                  </small>
                  <small>
                    {trx.method}
                    {trx.adminFee ? ` · biaya admin ${formatRupiah(trx.adminFee)}` : ""}
                    {trx.external ? " · tidak memotong saldo" : ""}
                  </small>
                  {(trx.orderId || trx.redirectUrl) && (
                    <span className="trx-links">
                      {trx.orderId && <Link href={`/customer/orders/${trx.orderId}`}>Lihat pesanan</Link>}
                      {trx.redirectUrl && <a href={trx.redirectUrl}>Lanjutkan pembayaran</a>}
                    </span>
                  )}
                </div>
                <div className="right">
                  <strong className={trx.type === "in" ? "in" : ""}>
                    {trx.type === "in" ? "+" : "−"}
                    {formatRupiah(trx.amount)}
                  </strong>
                  <StatusPill tone={STATUS[trx.status].tone}>{STATUS[trx.status].label}</StatusPill>
                </div>
              </div>
            ))}
            {wallet && rows.length > 0 && (
              <p className="hint" style={{ marginTop: 16 }}>
                {rows.length} transaksi ditampilkan
              </p>
            )}
          </section>
        </div>

        <aside className="stack" id="topup">
          <section className="card">
            <h2 className="card-title">Top up saldo</h2>
            <p className="card-sub" style={{ marginBottom: 20 }}>
              Pembayaran lewat Midtrans. Saldo masuk otomatis setelah pembayaran terkonfirmasi.
            </p>
            <p className="label" style={{ marginBottom: 10 }}>
              Nominal top up
            </p>
            <div className="amount-grid">
              {TOPUP_PRESETS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`amount-opt ${!custom && amount === v ? "selected" : ""}`}
                  onClick={() => {
                    setAmount(v);
                    setCustom("");
                  }}
                  aria-pressed={!custom && amount === v}
                >
                  {formatRupiah(v)}
                </button>
              ))}
            </div>
            <div className="field" style={{ marginBottom: 18 }}>
              <label className="label" htmlFor="topup-custom">
                Nominal lain
              </label>
              <div className="sv-money">
                <span>Rp</span>
                <input
                  id="topup-custom"
                  className="input"
                  inputMode="numeric"
                  placeholder="Mis. 75.000"
                  value={custom ? Number(custom).toLocaleString("id-ID") : ""}
                  onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 8))}
                />
              </div>
            </div>
            <p className="label" style={{ marginBottom: 10 }}>
              Metode pembayaran
            </p>
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`method-opt ${method === m.id ? "selected" : ""}`}
                onClick={() => setMethod(m.id)}
                aria-pressed={method === m.id}
              >
                <Icon name={m.icon} size={18} />
                <span className="grow">
                  {m.label}
                  <small>{m.note}</small>
                </span>
                <span className="radio" />
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 16 }}>
              <div className="pay-row">
                <span>Nominal masuk saldo</span>
                <strong>{formatRupiah(value)}</strong>
              </div>
              <div className="pay-row">
                <span>Biaya admin</span>
                <strong>{formatRupiah(TOPUP_ADMIN_FEE)}</strong>
              </div>
              <div className="pay-total" style={{ borderTop: 0, paddingTop: 0 }}>
                <span style={{ fontWeight: 400, color: "var(--muted)" }}>Total pembayaran</span>
                <strong style={{ fontSize: 20 }}>{formatRupiah(total)}</strong>
              </div>
            </div>
            {formError && (
              <p className="field-error" role="alert" style={{ marginBottom: 10 }}>
                {formError}
              </p>
            )}
            <button className="btn btn-primary btn-block" disabled={paying} onClick={topup}>
              {paying ? <span className="spinner" /> : <Icon name="arrowRight" size={16} />} Bayar dengan Midtrans
            </button>
            <p className="hint" style={{ marginTop: 12 }}>
              Minimal {formatRupiah(TOPUP_MIN)}, maksimal {formatRupiah(TOPUP_MAX)}. Batas pembayaran 24 jam.
            </p>
          </section>

          <div className="alert alert-info">
            <Icon name="refresh" size={18} />
            <div>
              <strong style={{ fontWeight: 500 }}>Refund otomatis ke saldo</strong>
              Pesanan yang sudah dibayar lalu dibatalkan sebelum diambil surveyor dikembalikan penuh ke Saldo CKIN.
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
