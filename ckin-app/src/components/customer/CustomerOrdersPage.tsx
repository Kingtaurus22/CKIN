"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ErrorState, PageHeader } from "@/src/components/ui/common";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import type { OrderFilter } from "@/src/lib/order-status";
import type { CustomerOrderSummary, OrderCounts } from "@/src/types/customer";
import { ORDER_TABS } from "./CustomerDashboard";
import OrdersTable from "./OrdersTable";

export default function CustomerOrdersPage() {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [counts, setCounts] = useState<OrderCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tunda pencarian sampai user berhenti mengetik.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ status: filter });
      if (search) params.set("q", search);
      const data = await apiFetch<{ orders: CustomerOrderSummary[]; counts: OrderCounts }>(
        `/api/customer/orders?${params}`,
      );
      setOrders(data.orders);
      setCounts(data.counts);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Ruang pengguna"
        title="Pesanan saya"
        subtitle="Pantau semua perjalanan surveimu, dari pembayaran hingga laporan."
        actions={
          <Link className="btn btn-primary" href="/customer/orders/new">
            <Icon name="plus" size={16} /> Buat pesanan
          </Link>
        }
      />

      {error && <div style={{ marginBottom: 20 }}><ErrorState message={error} onRetry={load} /></div>}

      <section className="panel">
        <div className="panel-head">
          <div className="row" style={{ alignItems: "center" }}>
            <div>
              <h2 className="card-title">Semua pesanan</h2>
              <p className="card-sub">{counts ? `${counts.all} pesanan tercatat` : "Memuat…"}</p>
            </div>
            <div className="input-wrap" style={{ width: 260, maxWidth: "100%" }}>
              <Icon name="search" size={16} />
              <input
                className="input"
                placeholder="Cari kode atau lokasi…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Cari pesanan"
              />
            </div>
          </div>
          <div className="tabs" role="tablist" aria-label="Filter status pesanan">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filter === tab.value}
                className={`tab ${filter === tab.value ? "active" : ""}`}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label}
                <span className="count">{counts ? counts[tab.countKey] : ""}</span>
              </button>
            ))}
          </div>
        </div>
        <OrdersTable
          orders={orders}
          loading={loading}
          emptyText={search ? `Tidak ada pesanan yang cocok dengan “${search}”.` : undefined}
        />
        {!loading && orders.length > 0 && (
          <div className="table-foot">
            <span>{orders.length} pesanan ditampilkan</span>
            <span>Status diperbarui otomatis oleh sistem CKIN</span>
          </div>
        )}
      </section>
    </>
  );
}
