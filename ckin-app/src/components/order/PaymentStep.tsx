"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Icon, { type IconName } from "@/src/components/ui/Icon";
import { ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { apiFetch, ClientApiError, errorMessage } from "@/src/lib/client-api";
import { formatDate, formatDateTime, formatRupiah } from "@/src/lib/format";
import type { PaymentMethod } from "@/src/schemas/order";
import type { CustomerOrderDetail, WalletView } from "@/src/types/customer";

const METHODS: Array<{ id: Exclude<PaymentMethod, "saldo">; label: string; sub: string; icon: IconName }> = [
  { id: "bank", label: "Transfer bank / Virtual Account", sub: "BCA, BNI, BRI, Mandiri, dan bank lainnya", icon: "bank" },
  { id: "qris", label: "QRIS", sub: "Scan dari aplikasi bank atau e-wallet favoritmu", icon: "qr" },
  { id: "ewallet", label: "E-wallet", sub: "GoPay dan ShopeePay", icon: "wallet" },
];

/** Halaman pembayaran pesanan (Anggota 2): Saldo CKIN atau Midtrans Snap. */
export default function PaymentStep({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("saldo");
  const [accepted, setAccepted] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [orderData, wallet] = await Promise.all([
        apiFetch<{ order: CustomerOrderDetail }>(`/api/customer/orders/${id}`),
        apiFetch<WalletView>("/api/customer/wallet").catch(() => null),
      ]);
      setOrder(orderData.order);
      const bal = wallet?.balance ?? 0;
      setBalance(bal);
      if (bal < orderData.order.pricing.total) setMethod("bank");
    } catch (err) {
      if (err instanceof ClientApiError && err.status === 404) setNotFound(true);
      else setLoadError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function pay() {
    if (!order) return;
    if (!accepted) return setError("Setujui ketentuan pembayaran terlebih dahulu.");
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch<{ paid: boolean; redirectUrl?: string }>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ orderId: order.id, method }),
      });
      if (result.paid) {
        router.push(`/customer/orders/${order.id}`);
        return;
      }
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      throw new Error("Halaman pembayaran Midtrans tidak tersedia.");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div className="card empty">
        <strong>Pesanan tidak ditemukan</strong>
        <Link className="btn btn-primary btn-sm" href="/customer/orders">
          Kembali ke pesanan saya
        </Link>
      </div>
    );
  }
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!order || balance === null) {
    return (
      <div className="stack">
        <Skeleton height={34} width="45%" />
        <Skeleton height={70} />
        <Skeleton height={320} />
      </div>
    );
  }

  const total = order.pricing.total;
  const payable = order.status === "PENDING_PAYMENT";
  const enoughSaldo = balance >= total;

  return (
    <>
      <PageHeader
        eyebrow="Pembayaran"
        title={payable ? "Amankan jadwal surveimu." : "Status pembayaran pesanan."}
        subtitle={`Pembayaran untuk pesanan #${order.code} · ${order.location}`}
        actions={<StatusPill tone={order.statusTone}>{order.statusLabel}</StatusPill>}
      />

      {payable && order.expiresAt && (
        <div className="alert alert-warning" style={{ marginBottom: 22 }}>
          <Icon name="info" size={18} />
          <div>
            <strong>Batas pembayaran: {formatDateTime(order.expiresAt)}</strong>
            Bayar tepat waktu untuk mengonfirmasi jadwal {formatDate(order.surveyDate, "long")}. Pesanan akan
            kedaluwarsa jika melewati batas ini.
          </div>
        </div>
      )}

      {!payable ? (
        <div className="card empty">
          <strong>
            {order.payment === "Sudah dibayar" ? "Pesanan ini sudah dibayar" : `Pesanan ${order.statusLabel.toLowerCase()}`}
          </strong>
          <p>Tidak ada pembayaran yang perlu dilakukan.</p>
          <Link className="btn btn-primary btn-sm" href={`/customer/orders/${order.id}`}>
            Lihat detail pesanan
          </Link>
        </div>
      ) : (
        <div className="two-col">
          <div className="stack">
            <section className="card">
              <h2 className="card-title">Pilih metode pembayaran</h2>
              <p className="card-sub" style={{ marginBottom: 20 }}>
                Pilih salah satu metode yang paling nyaman untukmu.
              </p>

              <button
                type="button"
                className={`method ${method === "saldo" ? "selected" : ""}`}
                onClick={() => setMethod("saldo")}
                disabled={!enoughSaldo}
                aria-pressed={method === "saldo"}
              >
                <span className="row">
                  <Icon name="wallet" size={22} className="ic" />
                  <span className="txt">
                    <strong>Saldo CKIN</strong>
                    <small>{enoughSaldo ? "Saldo tersedia" : "Saldo tidak cukup untuk pesanan ini"}</small>
                  </span>
                  <span className="amount">{formatRupiah(balance)}</span>
                  <span className="radio" />
                </span>
                {method === "saldo" && (
                  <span className="sub">
                    Sisa saldo setelah pembayaran <strong>{formatRupiah(balance - total)}</strong>
                  </span>
                )}
              </button>

              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`method ${method === m.id ? "selected" : ""}`}
                  onClick={() => setMethod(m.id)}
                  aria-pressed={method === m.id}
                >
                  <span className="row">
                    <Icon name={m.icon} size={22} className="ic" />
                    <span className="txt">
                      <strong>{m.label}</strong>
                      <small>{m.sub}</small>
                    </span>
                    <span className="radio" />
                  </span>
                </button>
              ))}
            </section>

            <section className="card">
              <div className="report-cta">
                <Icon name="shield" size={24} />
                <div>
                  <h3>Dana aman, proses transparan.</h3>
                  <p>
                    Pembayaran dicatat otomatis. Pembayaran non-saldo diproses aman melalui Midtrans. Jika
                    survei dibatalkan sesuai kebijakan, pengembalian dana masuk ke Saldo CKIN.
                  </p>
                </div>
              </div>
            </section>

            <div>
              <Link className="btn btn-secondary" href={`/customer/orders/${order.id}`}>
                <Icon name="arrowLeft" size={16} /> Kembali ke detail pesanan
              </Link>
            </div>
          </div>

          <aside className="stack">
            <section className="card">
              <h2 className="card-title" style={{ marginBottom: 18 }}>
                Ringkasan pembayaran
              </h2>
              <div className="summary-loc">
                <span className="ic">
                  <Icon name="clipboard" size={17} />
                </span>
                <div>
                  <strong>#{order.code}</strong>
                  <small>
                    {order.kosCount} kos · {order.location}
                  </small>
                </div>
              </div>
              <div className="pay-row">
                <span>Jadwal</span>
                <strong style={{ fontWeight: 400 }}>
                  {formatDate(order.surveyDate)} · {order.surveyTimeSlot?.split("–")[0] ?? ""}
                </strong>
              </div>
              <div className="pay-row">
                <span>
                  Biaya survei ({order.kosCount} × {formatRupiah(order.pricing.perKos)})
                </span>
                <strong style={{ fontWeight: 400 }}>{formatRupiah(order.pricing.perKos * order.kosCount)}</strong>
              </div>
              <div className="pay-row">
                <span>Biaya layanan</span>
                <strong style={{ fontWeight: 400 }}>{formatRupiah(order.pricing.serviceFee)}</strong>
              </div>
              <div className="summary-sep" />
              <p className="hint">Total pembayaran</p>
              <p className="big-total">{formatRupiah(total)}</p>
              <p className="hint" style={{ marginBottom: 16 }}>
                {method === "saldo" ? "Dibayar dengan Saldo CKIN" : `Dibayar via ${METHODS.find((m) => m.id === method)?.label}`}
              </p>
              <label className="check" style={{ marginBottom: 16 }}>
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                Saya menyetujui ketentuan pembayaran.
              </label>
              {error && (
                <div className="alert alert-danger" role="alert" style={{ marginBottom: 14 }}>
                  <Icon name="alert" size={17} />
                  <span>{error}</span>
                </div>
              )}
              <button type="button" className="btn btn-primary btn-block" onClick={pay} disabled={busy || !accepted}>
                {busy ? <span className="spinner" /> : <Icon name="lock" size={16} />}
                {busy
                  ? method === "saldo"
                    ? "Memproses…"
                    : "Menghubungkan ke Midtrans…"
                  : `Bayar ${formatRupiah(total)}`}
              </button>
              <p className="center-note">
                {method === "saldo"
                  ? "Saldo dipotong setelah kamu mengonfirmasi pembayaran. Bukti bayar tersimpan di pesanan."
                  : "Kamu akan diarahkan ke halaman pembayaran Midtrans."}
              </p>
            </section>
            <p className="center-note">
              <Icon name="shield" size={13} /> Terenkripsi · Aman · Tercatat otomatis
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
