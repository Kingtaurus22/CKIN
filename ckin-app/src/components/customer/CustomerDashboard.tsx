"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ErrorState, PageHeader } from "@/src/components/ui/common";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { firstName, formatRupiah } from "@/src/lib/format";
import type { OrderFilter } from "@/src/lib/order-status";
import type { CustomerDashboardData, CustomerOrderSummary, OrderCounts } from "@/src/types/customer";
import OrdersTable from "./OrdersTable";

export const ORDER_TABS: Array<{ value: OrderFilter; label: string; countKey: keyof OrderCounts }> = [
  { value: "all", label: "Semua pesanan", countKey: "all" },
  { value: "active", label: "Aktif", countKey: "active" },
  { value: "completed", label: "Selesai", countKey: "completed" },
  { value: "other", label: "Lainnya", countKey: "other" },
];

export default function CustomerDashboard() {
  const { user } = useWorkspace();
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await apiFetch<CustomerDashboardData>("/api/customer/dashboard");
      setData(result);
      setOrders(result.recentOrders);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeFilter(next: OrderFilter) {
    setFilter(next);
    if (next === "all" && data) {
      setOrders(data.recentOrders);
      return;
    }
    setOrdersLoading(true);
    try {
      const result = await apiFetch<{ orders: CustomerOrderSummary[] }>(`/api/customer/orders?status=${next}`);
      setOrders(result.orders.slice(0, 5));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  }

  const counts = data?.counts;
  const name = firstName(user?.fullname);

  return (
    <>
      <PageHeader
        eyebrow="Ruang pengguna"
        title={name ? `Halo, ${name}. Siap cari tempat baru?` : "Halo! Siap cari tempat baru?"}
        subtitle="Pantau survei, kelola pesanan, dan temukan kos yang paling pas untukmu."
        actions={
          <Link className="btn btn-primary" href="/customer/orders/new">
            <Icon name="plus" size={16} /> Buat pesanan
          </Link>
        }
      />

      {error && <div style={{ marginBottom: 20 }}><ErrorState message={error} onRetry={load} /></div>}

      <section className="hero-banner">
        <div className="copy">
          <p className="kicker">Pindah kos, tanpa waswas</p>
          <h2>Kamu pilih areanya. Kami cek kosnya.</h2>
          <p>Dari kondisi kamar sampai lingkungan sekitar, surveyor lokal siap membantu.</p>
          <Link className="text-link" href="/customer/orders/new">
            {counts && counts.all > 0 ? "Buat survei baru" : "Mulai survei kos pertamamu"}{" "}
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
        <Image src="/images/customer-room.jpg" alt="Kamar kos yang nyaman" width={560} height={376} priority />
      </section>

      <section className="stat-grid" aria-label="Ringkasan aktivitas">
        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="clipboard" size={20} />
          </div>
          <div>
            <p className="stat-label">Pesanan aktif</p>
            <p className="stat-value">{counts ? counts.active : "–"}</p>
            <p className="stat-note">
              {counts ? (counts.unpaid > 0 ? `${counts.unpaid} menunggu pembayaran` : "Tidak ada tagihan tertunda") : "Memuat…"}
            </p>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="checkCircle" size={20} />
          </div>
          <div>
            <p className="stat-label">Survei selesai</p>
            <p className="stat-value">{counts ? counts.completed : "–"}</p>
            <p className="stat-note">Kos sudah dicek langsung</p>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="wallet" size={20} />
          </div>
          <div>
            <p className="stat-label">Saldo CKIN</p>
            <p className="stat-value">{data ? formatRupiah(data.walletBalance) : "–"}</p>
            <p className="stat-note">
              <Link href="/customer/wallet">Top up saldo ↗</Link>
            </p>
          </div>
        </article>
      </section>

      <section className="panel" aria-labelledby="orders-title">
        <div className="panel-head">
          <div className="row">
            <div>
              <h2 className="card-title" id="orders-title">
                Pesanan saya
              </h2>
              <p className="card-sub">Semua perjalanan surveimu, di satu tempat.</p>
            </div>
            <Link className="btn btn-secondary btn-sm" href="/customer/orders">
              <Icon name="arrowUpRight" size={15} /> Lihat semua pesanan
            </Link>
          </div>
          <div className="tabs" role="tablist" aria-label="Filter pesanan">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filter === tab.value}
                className={`tab ${filter === tab.value ? "active" : ""}`}
                onClick={() => changeFilter(tab.value)}
              >
                {tab.label}
                <span className="count">{counts ? counts[tab.countKey] : ""}</span>
              </button>
            ))}
          </div>
        </div>
        <OrdersTable
          orders={orders}
          loading={ordersLoading}
          emptyText={
            counts?.all === 0
              ? "Belum ada pesanan. Mulai survei kos pertamamu dari tombol “Buat pesanan”."
              : "Belum ada pesanan pada kategori ini."
          }
        />
      </section>

      <p className="reminder">
        <Icon name="calendar" size={18} /> Rencanakan survei setidaknya 7 hari sebelum pindah agar kamu
        punya waktu menentukan pilihan.
      </p>
    </>
  );
}
