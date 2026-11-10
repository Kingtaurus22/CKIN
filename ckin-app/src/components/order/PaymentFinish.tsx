"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/client-api";
import Icon from "@/src/components/ui/Icon";

/**
 * Halaman tujuan setelah customer menutup Snap Midtrans.
 * Status final tetap ditentukan webhook /api/payments/notification.
 */
export default function PaymentFinish() {
  const [info, setInfo] = useState<{ orderId: string | null; status: string; reference: string | null } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("order_id");
    // Format order_id Midtrans: CKIN-<id pesanan>-<timestamp>
    const match = reference?.match(/^CKIN-([a-f0-9]{24})-\d+$/i);
    const orderId = match?.[1] ?? null;
    const status = params.get("transaction_status") ?? "pending";
    setInfo({ orderId, status, reference });

    // Pastikan status pesanan di CKIN ikut diperbarui (webhook bisa terlambat
    // atau tidak sampai saat development di localhost).
    if (orderId) {
      apiFetch<{ changed: boolean; status: string }>("/api/payments/sync", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      })
        .then((result) => {
          if (result.changed) setInfo({ orderId, status: "settlement", reference });
        })
        .catch(() => undefined);
    }
  }, []);

  const paid = info?.status === "settlement" || info?.status === "capture";
  const failed = ["deny", "cancel", "expire", "failure"].includes(info?.status ?? "");

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <section className="card" style={{ textAlign: "center", padding: "36px 30px" }}>
        <span
          className="avatar lg"
          style={{
            margin: "0 auto 18px",
            background: failed ? "var(--danger-bg)" : "var(--mint)",
            color: failed ? "var(--danger-ink)" : "var(--forest)",
          }}
        >
          <Icon name={paid ? "check" : failed ? "x" : "refresh"} size={24} />
        </span>
        <h1 className="card-title" style={{ fontSize: 22 }}>
          {paid ? "Pembayaran diterima" : failed ? "Pembayaran belum berhasil" : "Pembayaran sedang diproses"}
        </h1>
        <p className="card-sub" style={{ lineHeight: 1.65, marginTop: 10 }}>
          {paid
            ? "Terima kasih! Pesananmu kini tampil untuk surveyor di area tujuan."
            : failed
              ? "Transaksi dibatalkan atau gagal. Kamu bisa mencoba bayar lagi sebelum batas waktu."
              : "Midtrans sedang mengonfirmasi pembayaranmu. Status pesanan diperbarui otomatis dalam beberapa saat."}
        </p>
        {info?.reference && <p className="hint" style={{ marginTop: 14 }}>Referensi: {info.reference}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          {info?.orderId && (
            <Link
              className="btn btn-primary"
              href={failed ? `/customer/orders/${info.orderId}/payment` : `/customer/orders/${info.orderId}`}
            >
              {failed ? "Coba bayar lagi" : "Lihat pesanan"}
            </Link>
          )}
          <Link className="btn btn-secondary" href="/customer">
            Ke dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
