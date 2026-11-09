"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type OrderStatus =
  | "Belum dibayar"
  | "Dalam proses"
  | "Selesai"
  | "Dibatalkan"
  | "Kedaluwarsa";
type Order = {
  id: string;
  location: string;
  date: string;
  kosCount: number;
  surveyor: string;
  status: OrderStatus;
  payment: string;
  action: string;
};

// Data contoh mengikuti konten Figma. Nantinya diganti dengan data dari API order milik Anggota 2.
const orders: Order[] = [
  {
    id: "#SGH-261108",
    location: "Depok, Sleman",
    date: "18 Nov 2026",
    kosCount: 3,
    surveyor: "menunggu surveyor",
    status: "Belum dibayar",
    payment: "Rp230.000",
    action: "Bayar sekarang",
  },
  {
    id: "#SGH-261102",
    location: "Mlati, Sleman",
    date: "06 Nov 2026",
    kosCount: 2,
    surveyor: "Nanda Rahma",
    status: "Dalam proses",
    payment: "Sudah dibayar",
    action: "Lihat progres",
  },
  {
    id: "#SGH-261024",
    location: "Depok, Sleman",
    date: "24 Okt 2026",
    kosCount: 3,
    surveyor: "Bima Wicaksono",
    status: "Selesai",
    payment: "Sudah dibayar",
    action: "Lihat laporan",
  },
  {
    id: "#SGH-261019",
    location: "Gondokusuman",
    date: "19 Okt 2026",
    kosCount: 1,
    surveyor: "Dito Pratama",
    status: "Dibatalkan",
    payment: "Dikembalikan",
    action: "Lihat detail",
  },
  {
    id: "#SGH-261015",
    location: "Banguntapan",
    date: "15 Okt 2026",
    kosCount: 2,
    surveyor: "Nanda Rahma",
    status: "Kedaluwarsa",
    payment: "Belum dibayar",
    action: "Pesan ulang",
  },
];

const filters = [
  { label: "Semua pesanan", value: "Semua", count: 9 },
  { label: "Aktif", value: "Aktif", count: 2 },
  { label: "Selesai", value: "Selesai", count: 4 },
  { label: "Lainnya", value: "Lainnya", count: 3 },
] as const;

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "bell")
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  if (name === "arrow")
    return (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    );
  if (name === "orders")
    return (
      <svg {...common}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3.5h6v3H9zM9 11h6M9 15h6" />
      </svg>
    );
  if (name === "check")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  if (name === "wallet")
    return (
      <svg {...common}>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6a2 2 0 0 1-2-2z" />
        <path d="M4 7h14a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5M15 13h.01" />
      </svg>
    );
  if (name === "calendar")
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 15l2 2 5-5" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  if (name === "chevron")
    return (
      <svg {...common}>
        <path d="m7 10 5 5 5-5" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function statusClass(status: OrderStatus) {
  if (status === "Belum dibayar") return "status-unpaid";
  if (status === "Dalam proses") return "status-progress";
  if (status === "Selesai") return "status-done";
  if (status === "Dibatalkan") return "status-cancelled";
  return "status-expired";
}

export default function CustomerDashboard() {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]["value"]>("Semua");
  const filteredOrders = useMemo(() => {
    if (activeFilter === "Aktif")
      return orders.filter(
        (order) =>
          order.status === "Belum dibayar" || order.status === "Dalam proses",
      );
    if (activeFilter === "Selesai")
      return orders.filter((order) => order.status === "Selesai");
    if (activeFilter === "Lainnya")
      return orders.filter(
        (order) =>
          order.status === "Dibatalkan" || order.status === "Kedaluwarsa",
      );
    return orders;
  }, [activeFilter]);

  return (
    <div className="customer-shell">
      <main className="customer-main">
        <section className="dashboard-intro">
          <div>
            <p className="eyebrow">Ruang Pengguna</p>
            <h1>Halo, Alya. Siap cari tempat baru?</h1>
            <p>
              Pantau survei, kelola pesanan, dan temukan kos yang paling pas
              untukmu.
            </p>
          </div>
          <Link className="primary-button" href="/#pesanan">
            <Icon name="plus" size={16} /> Lihat pesanan saya
          </Link>
        </section>

        <section className="hero-banner">
          <div className="hero-copy">
            <p className="hero-kicker">PINDAH KOS, TANPA WASWAS</p>
            <h2>Kamu pilih areanya. Kami cek kosnya.</h2>
            <p>
              Dari kondisi kamar sampai lingkungan sekitar, surveyor lokal siap
              membantu.
            </p>
            <a className="text-link" href="#pesanan">
              Mulai survei kos pertamamu <Icon name="arrow" size={14} />
            </a>
          </div>
          <Image
            className="hero-image"
            src="/images/customer-room.jpg"
            alt="Interior kamar kos yang nyaman"
            width={1264}
            height={848}
            priority
          />
        </section>

        <section className="stats-grid" aria-label="Ringkasan aktivitas">
          <article className="stat-card">
            <div className="stat-icon">
              <Icon name="orders" size={21} />
            </div>
            <div>
              <p className="stat-label">Pesanan aktif</p>
              <p className="stat-value">2</p>
              <p className="stat-note">1 menunggu pembayaran</p>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-icon">
              <Icon name="check" size={21} />
            </div>
            <div>
              <p className="stat-label">Survei selesai</p>
              <p className="stat-value">4</p>
              <p className="stat-note">Kos sudah dicek langsung</p>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-icon">
              <Icon name="wallet" size={21} />
            </div>
            <div>
              <p className="stat-label">Saldo CKIN</p>
              <p className="stat-value">Rp350.000</p>
              <p className="stat-note">
                <Link href="/customer/wallet">Lihat riwayat saldo&nbsp; ↗</Link>
              </p>
            </div>
          </article>
        </section>

        <section className="orders-panel" id="pesanan">
          <div className="orders-header">
            <div className="orders-title-row">
              <div>
                <h2>Pesanan saya</h2>
                <p>Semua perjalanan surveimu, di satu tempat.</p>
              </div>
              <Link className="secondary-button" href="/customer/orders">
                ↗&nbsp; Lihat semua pesanan
              </Link>
            </div>
          </div>
          <nav className="order-tabs" aria-label="Filter pesanan">
            {filters.map((filter) => (
              <button
                key={filter.value}
                className={`order-tab ${activeFilter === filter.value ? "active" : ""}`}
                onClick={() => setActiveFilter(filter.value)}
                aria-pressed={activeFilter === filter.value}
              >
                {filter.label}
                <span>{filter.count}</span>
              </button>
            ))}
          </nav>
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>PESANAN / LOKASI</th>
                  <th>JADWAL SURVEI</th>
                  <th>STATUS</th>
                  <th>PEMBAYARAN</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="order-location">
                        {order.location} · {order.id}
                      </div>
                      <div className="order-meta">
                        {order.kosCount} kos · {order.surveyor}
                      </div>
                    </td>
                    <td>{order.date}</td>
                    <td>
                      <span
                        className={`status-pill ${statusClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td
                      className={
                        order.payment === "Sudah dibayar"
                          ? "payment-paid"
                          : order.payment === "Dikembalikan"
                            ? "payment-refund"
                            : ""
                      }
                    >
                      {order.payment}
                    </td>
                    <td>
                      <Link
                        className="table-action"
                        href={
                          order.status === "Belum dibayar"
                            ? `/customer/orders/${order.id.replace("#", "")}`
                            : order.status === "Selesai"
                              ? `/customer/reports/${order.id.replace("#", "")}`
                              : order.status === "Dalam proses"
                                ? `/customer/chat/${order.id.replace("#", "")}`
                                : "/#pesanan"
                        }
                      >
                        {order.status === "Dalam proses"
                          ? "Chat surveyor"
                          : order.action}{" "}
                        →
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-orders">
                        Belum ada pesanan pada kategori ini.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="dashboard-reminder">
          <Icon name="calendar" size={16} /> Rencanakan survei setidaknya 7 hari
          sebelum pindah agar kamu punya waktu menentukan pilihan.
        </p>
        <footer className="customer-footer">
          <span>CKIN — cek dulu, baru pindah.</span>
          <nav className="footer-links">
            <a href="#bantuan">Pusat bantuan</a>
            <span>·</span>
            <a href="#syarat">Syarat &amp; ketentuan</a>
            <span>·</span>
            <a href="#privasi">Privasi</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
