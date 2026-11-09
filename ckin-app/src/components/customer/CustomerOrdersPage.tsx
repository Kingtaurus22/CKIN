"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  customerOrders,
  type CustomerOrder,
} from "@/src/lib/customer-orders";

const filters = [
  { label: "Semua pesanan", value: "Semua" },
  { label: "Aktif", value: "Aktif" },
  { label: "Selesai", value: "Selesai" },
  { label: "Lainnya", value: "Lainnya" },
] as const;

type OrderFilter = (typeof filters)[number]["value"];

function isActiveOrder(order: CustomerOrder) {
  return (
    order.status === "Belum dibayar" ||
    order.status === "Menunggu surveyor" ||
    order.status === "Dalam proses" ||
    order.status === "Laporan diterima"
  );
}

function statusClass(status: CustomerOrder["status"]) {
  if (status === "Belum dibayar") return "status-unpaid";
  if (status === "Menunggu surveyor" || status === "Dalam proses")
    return "status-progress";
  if (status === "Laporan diterima" || status === "Selesai")
    return "status-done";
  if (status === "Dibatalkan") return "status-cancelled";
  return "status-expired";
}

function getOrderAction(order: CustomerOrder) {
  if (order.status === "Belum dibayar") {
    return {
      label: "Bayar sekarang",
      href: `/customer/orders/${order.id}`,
    };
  }
  if (order.status === "Menunggu surveyor") {
    return {
      label: "Lihat progres",
      href: `/customer/orders/${order.id}`,
    };
  }
  if (order.status === "Dalam proses") {
    return {
      label: "Chat surveyor",
      href: `/customer/chat/${order.id}`,
    };
  }
  if (order.status === "Selesai" || order.status === "Laporan diterima") {
    return {
      label: "Lihat laporan",
      href: `/customer/reports/${order.id}`,
    };
  }
  if (order.status === "Dibatalkan") {
    return {
      label: "Lihat detail",
      href: `/customer/orders/${order.id}`,
    };
  }
  return {
    label: "Pesan ulang",
    href: "/customer#pesanan",
  };
}

export default function CustomerOrdersPage() {
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("Semua");
  const filteredOrders = useMemo(() => {
    if (activeFilter === "Aktif") return customerOrders.filter(isActiveOrder);
    if (activeFilter === "Selesai") {
      return customerOrders.filter((order) => order.status === "Selesai");
    }
    if (activeFilter === "Lainnya") {
      return customerOrders.filter(
        (order) =>
          order.status === "Dibatalkan" || order.status === "Kedaluwarsa",
      );
    }
    return customerOrders;
  }, [activeFilter]);

  return (
    <div className="customer-shell">
      <main className="customer-main customer-orders-page">
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/customer">Workspace</Link>
          <span>/</span>
          <strong>Pesanan saya</strong>
        </nav>

        <section className="orders-page-heading">
          <div>
            <p className="eyebrow">Ruang Pengguna</p>
            <h1>Pesanan saya</h1>
            <p>Pantau semua perjalanan surveimu, dari awal hingga selesai.</p>
          </div>
          <Link className="secondary-button" href="/customer">
            ←&nbsp; Kembali ke dashboard
          </Link>
        </section>

        <section className="orders-panel" aria-label="Daftar pesanan">
          <div className="orders-header orders-page-header">
            <div className="orders-title-row">
              <div>
                <h2>Semua pesanan</h2>
                <p>{customerOrders.length} pesanan tercatat</p>
              </div>
            </div>
          </div>
          <nav className="order-tabs" aria-label="Filter pesanan">
            {filters.map((filter) => {
              const count =
                filter.value === "Semua"
                  ? customerOrders.length
                  : filter.value === "Aktif"
                    ? customerOrders.filter(isActiveOrder).length
                    : filter.value === "Selesai"
                      ? customerOrders.filter(
                          (order) => order.status === "Selesai",
                        ).length
                      : customerOrders.filter(
                          (order) =>
                            order.status === "Dibatalkan" ||
                            order.status === "Kedaluwarsa",
                        ).length;

              return (
                <button
                  key={filter.value}
                  className={`order-tab ${activeFilter === filter.value ? "active" : ""}`}
                  onClick={() => setActiveFilter(filter.value)}
                  aria-pressed={activeFilter === filter.value}
                >
                  {filter.label}
                  <span>{count}</span>
                </button>
              );
            })}
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
                {filteredOrders.map((order) => {
                  const action = getOrderAction(order);

                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="order-location">
                          {order.location} · #{order.id}
                        </div>
                        <div className="order-meta">
                          {order.kosCount} kos ·{" "}
                          {order.surveyor || "Menunggu surveyor"}
                        </div>
                      </td>
                      <td>{order.surveyDate}</td>
                      <td>
                        <span
                          className={`status-pill ${statusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td
                        className={
                          order.paymentStatus === "Sudah dibayar"
                            ? "payment-paid"
                            : order.paymentStatus === "Dikembalikan"
                              ? "payment-refund"
                              : ""
                        }
                      >
                        {order.paymentStatus}
                      </td>
                      <td>
                        <Link className="table-action" href={action.href}>
                          {action.label} →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
          Rencanakan survei setidaknya 7 hari sebelum pindah agar kamu punya
          waktu menentukan pilihan.
        </p>
        <footer className="customer-footer">
          <span>CKIN — cek dulu, baru pindah.</span>
          <nav className="footer-links" aria-label="Tautan informasi">
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
