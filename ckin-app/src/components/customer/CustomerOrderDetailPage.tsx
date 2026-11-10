"use client";

import Link from "next/link";
import { useState } from "react";
import { customerOrders, formatRupiah } from "@/src/lib/customer-orders";
import { useRouter } from "next/navigation";

export default function CustomerOrderDetailPage({ id }: { id: string }) {
  const order = customerOrders.find(
    (item) => item.id.replace("#", "") === id.replace("#", ""),
  );

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const router = useRouter();

  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  if (!order) {
    return (
      <main className="customer-main">
        <section className="detail-not-found">
          <h1>Pesanan tidak ditemukan</h1>
          <p>Pesanan yang kamu cari tidak tersedia.</p>
          <Link href="/" className="detail-primary-button">
            Kembali ke dashboard
          </Link>
        </section>
      </main>
    );
  }

  const isUnpaid = order.paymentStatus === "Belum dibayar";
  const isCancelled = cancelled || order.status === "Dibatalkan";

  const serviceFee = 5000;
  const surveyPrice = order.amount - serviceFee;

  const handleCancel = async () => {
    try {
      setCancelLoading(true);
      setCancelError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        setCancelError("Silakan login kembali untuk membatalkan pesanan.");
        return;
      }

      const response = await fetch(
        `/api/orders/${encodeURIComponent(id)}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setCancelError(result.message || "Gagal membatalkan pesanan.");
        return;
      }

      setShowCancelModal(false);
      setCancelled(true);

      router.refresh();
    } catch (error) {
      console.error(error);
      setCancelError("Tidak dapat menghubungi server.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <main className="customer-main order-detail-page">
      {/* Breadcrumb */}
      <div className="detail-breadcrumb">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <Link href="/#pesanan">Pesanan saya</Link>
        <span>/</span>
        <strong>Detail pesanan</strong>
      </div>

      {/* Header */}
      <section className="detail-heading">
        <div>
          <p className="eyebrow">Detail pesanan</p>
          <h1>
            {isCancelled
              ? "Pesanan ini telah dibatalkan."
              : isUnpaid
                ? "Satu langkah lagi sebelum survei."
                : "Detail pesanan surveimu."}
          </h1>

          <p className="detail-subtitle">
            Pesanan #{order.id} · Dibuat {order.createdAt}
          </p>
        </div>

        <span
          className={`detail-status ${
            isCancelled ? "cancelled" : isUnpaid ? "unpaid" : "paid"
          }`}
        >
          {isCancelled
            ? "Dibatalkan"
            : isUnpaid
              ? "Belum dibayar"
              : order.paymentStatus}
        </span>
      </section>

      {/* Payment reminder */}
      {isUnpaid && !isCancelled && (
        <section className="detail-payment-alert">
          <span className="alert-icon">ⓘ</span>
          <div>
            <strong>Selesaikan pembayaran untuk melanjutkan pesanan.</strong>
            <p>
              Pesanan akan diproses setelah pembayaran berhasil dikonfirmasi
              oleh sistem CKIN.
            </p>
          </div>
        </section>
      )}

      <div className="order-detail-layout">
        {/* Left column */}
        <div className="order-detail-left">
          {/* Survey detail */}
          <section className="detail-card">
            <h2>Detail survei</h2>

            <div className="survey-info-grid">
              <div className="survey-info-item">
                <span>Lokasi</span>
                <strong>{order.location}</strong>
              </div>

              <div className="survey-info-item">
                <span>Tanggal survei</span>
                <strong>{order.surveyDate}</strong>
              </div>

              <div className="survey-info-item">
                <span>Jumlah kos</span>
                <strong>{order.kosCount} kos</strong>
              </div>

              <div className="survey-info-item">
                <span>Surveyor</span>
                <strong className="surveyor-pending">
                  {order.surveyor || "Menunggu surveyor"}
                </strong>
              </div>

              <div className="survey-info-item">
                <span>Pilihan kos</span>
                <strong>
                  {order.serviceType === "Rekomendasi surveyor"
                    ? "Rekomendasi surveyor"
                    : "Pilihan pengguna"}
                </strong>
              </div>
            </div>

            {!order.surveyor && (
              <div className="surveyor-note">
                Surveyor akan ditampilkan di sini setelah mengambil pesanan
                surveimu.
              </div>
            )}
          </section>

          {/* Kost preferences */}
          <section className="detail-card">
            <h2>Preferensi kos</h2>

            <div className="preference-tags">
              <span>● Kos putri</span>
              <span>● Rp1–1,8 juta / bulan</span>
              <span>● Dekat UGM</span>
            </div>

            <p className="preference-description">
              Kamar mandi dalam · AC · Wi-Fi · Tempat tidur &amp; lemari ·
              Parkir motor · Dapur bersama · Ventilasi · CCTV
            </p>

            <div className="customer-note">
              <strong>Catatan untuk surveyor</strong>
              <p>
                Prioritaskan lingkungan tenang. Saya bekerja dari kos, jadi
                sinyal dan Wi-Fi stabil penting. Tolong cek tekanan air dan
                pencahayaan kamar.
              </p>
            </div>

            <Link href="/#pesanan" className="detail-text-link">
              Ubah preferensi ↗
            </Link>
          </section>

          {/* Order journey */}
          <section className="detail-card">
            <h2>Perjalanan pesanan</h2>

            <div className="order-journey">
              <div className="journey-step current">
                <span>1</span>
                <strong>Pembayaran</strong>
                <small>
                  {isCancelled
                    ? "Dibatalkan"
                    : isUnpaid
                      ? "Menunggu"
                      : "Berhasil"}
                </small>
              </div>

              <div className="journey-step">
                <span>2</span>
                <strong>Survei</strong>
                <small>Belum dimulai</small>
              </div>

              <div className="journey-step">
                <span>3</span>
                <strong>Laporan</strong>
                <small>Belum diterima</small>
              </div>

              <div className="journey-step">
                <span>4</span>
                <strong>Selesai</strong>
                <small>Belum selesai</small>
              </div>
            </div>
          </section>

          {/* Report */}
          <section className="detail-card report-access-card">
            <div className="report-access-content">
              <span className="report-access-icon">▤</span>

              <div>
                <h3>Laporan survei</h3>
                <p>
                  Lihat dokumentasi foto, video, hasil pemeriksaan, dan
                  rekomendasi surveyor setelah survei selesai.
                </p>
              </div>
            </div>

            <Link
              href={`/customer/reports/${order.id.replace("#", "")}`}
              className="report-access-button"
            >
              Lihat laporan survei
            </Link>
          </section>

          {/* Cancel order */}
          {!isCancelled && isUnpaid && (
            <button
              className="cancel-order-link"
              onClick={() => setShowCancelModal(true)}
            >
              Batalkan pesanan
            </button>
          )}

          {isCancelled && (
            <div className="cancelled-message">
              Pesanan ini sudah dibatalkan.
            </div>
          )}
        </div>

        {/* Right column */}
        <aside className="order-detail-right">
          <section className="detail-card payment-card">
            <h2>Rincian pembayaran</h2>

            <div className="payment-row">
              <span>
                Survei {order.kosCount} kos ×{" "}
                {formatRupiah(Math.round(surveyPrice / order.kosCount))}
              </span>
              <strong>{formatRupiah(surveyPrice)}</strong>
            </div>

            <div className="payment-row">
              <span>Biaya layanan</span>
              <strong>{formatRupiah(serviceFee)}</strong>
            </div>

            <div className="payment-total">
              <span>Total</span>
              <strong>{formatRupiah(order.amount)}</strong>
            </div>

            {isUnpaid && !isCancelled ? (
              <>
                <button
                  className="detail-pay-button"
                  onClick={() =>
                    alert(
                      "Integrasi Midtrans Sandbox akan diaktifkan pada tahap berikutnya.",
                    )
                  }
                >
                  <span>→</span> Bayar sekarang
                </button>

                <p className="payment-secure-note">
                  Pembayaran aman melalui CKIN.
                </p>
              </>
            ) : (
              <div className="payment-completed">
                {isCancelled ? "Pesanan dibatalkan" : "Pembayaran selesai"}
              </div>
            )}
          </section>

          <section className="detail-card payment-method-card">
            <h2>Status pembayaran</h2>

            <div className="payment-method-status">
              <span className="payment-status-dot" />
              <div>
                <strong>
                  {isCancelled
                    ? "Dibatalkan"
                    : isUnpaid
                      ? "Menunggu pembayaran"
                      : "Sudah dibayar"}
                </strong>
                <p>
                  {isCancelled
                    ? "Pesanan tidak dapat dibayar lagi."
                    : isUnpaid
                      ? "Silakan selesaikan pembayaran untuk melanjutkan."
                      : "Pembayaran telah dikonfirmasi."}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Cancellation confirmation */}
      {showCancelModal && (
        <div className="cancel-modal-overlay">
          <section
            className="cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            <div className="cancel-modal-icon">!</div>

            <h2 id="cancel-modal-title">Batalkan pesanan?</h2>

            {cancelError && (
              <p className="cancel-error-message">{cancelError}</p>
            )}

            <div className="cancel-modal-actions">
              <button
                className="cancel-keep-button"
                onClick={() => setShowCancelModal(false)}
              >
                Kembali
              </button>

              <button
                className="cancel-confirm-button"
                onClick={handleCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Memproses..." : "Ya, batalkan"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
