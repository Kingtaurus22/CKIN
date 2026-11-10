"use client";
import Link from "next/link";
import { useState } from "react";
import { customerOrders } from "@/src/lib/customer-orders";
export default function CustomerReportReviewPage({ id }: { id: string }) {
  const order = customerOrders.find((x) => x.id === id);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [sent, setSent] = useState(false);
  if (!order)
    return (
      <main className="customer-main report-page">
        <h1>Pesanan tidak ditemukan</h1>
        <Link href="/">Kembali ke dashboard</Link>
      </main>
    );
  const ready =
    order.status === "Selesai" || order.status === "Laporan diterima";
  return (
    <main className="customer-main report-page">
      <Link className="orders-back-link" href="/">
        ← Kembali ke dashboard
      </Link>
      <section className="orders-detail-card report-card">
        <p className="eyebrow">Laporan survei &amp; ulasan</p>
        <h1>Hasil survei kos</h1>
        <p className="report-subtitle">
          #{order.id} · {order.location} · Surveyor {order.surveyor}
        </p>
        {!ready ? (
          <div className="payment-alert">
            <strong>Laporan belum tersedia</strong>
            <p>
              Surveyor belum mengirimkan laporan akhir. Setelah laporan
              diterima, hasil survei dan formulir ulasan akan tersedia di
              halaman ini.
            </p>
          </div>
        ) : (
          <>
            <div className="report-summary">
              <span>Status laporan</span>
              <strong>✓ Laporan diterima</strong>
              <p>Survei untuk pesanan ini telah diselesaikan.</p>
            </div>
            <h2 className="section-title">Ringkasan hasil survei</h2>
            <div className="report-placeholder">
              <strong>Dokumentasi dan hasil pemeriksaan kos</strong>
              <p>
                Detail kos, alamat, ukuran kamar, harga, fasilitas, foto/video,
                kelebihan, kekurangan, dan catatan surveyor akan ditampilkan
                dari API laporan Anggota 3.
              </p>
              <ul>
                <li>Nama dan alamat kos</li>
                <li>Harga dan ukuran kamar</li>
                <li>Fasilitas dan kondisi lingkungan</li>
                <li>Dokumentasi foto/video</li>
                <li>Kelebihan, kekurangan, dan catatan surveyor</li>
              </ul>
            </div>
            <section className="review-panel">
              <p className="eyebrow">Bagikan pengalamanmu</p>
              <h2>Ulasan untuk surveyor</h2>
              <p>
                Bantu customer lain dengan memberikan penilaian atas layanan
                survei ini.
              </p>
              {sent ? (
                <div className="review-success">
                  <strong>Terima kasih atas ulasanmu!</strong>
                  <span>
                    Ulasan demo berhasil ditampilkan. Penyimpanan backend akan
                    dihubungkan setelah API ulasan tersedia.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (review.trim()) setSent(true);
                  }}
                >
                  <label>Penilaian</label>
                  <div
                    className="rating-picker"
                    role="radiogroup"
                    aria-label="Pilih rating"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setRating(n)}
                        aria-pressed={rating === n}
                        aria-label={`${n} bintang`}
                      >
                        {n <= rating ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                  <span className="rating-caption">
                    {rating} dari 5 bintang
                  </span>
                  <label htmlFor="review-text">Ceritakan pengalamanmu</label>
                  <textarea
                    id="review-text"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Bagaimana pengalamanmu menggunakan layanan survei CKIN?"
                    rows={5}
                    maxLength={1000}
                    required
                  />
                  <div className="review-form-foot">
                    <small>{review.length}/1000 karakter</small>
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={!review.trim()}
                    >
                      Kirim ulasan
                    </button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
