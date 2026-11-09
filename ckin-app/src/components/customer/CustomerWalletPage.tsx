"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
type Transaction = {
  id: string;
  title: string;
  detail: string;
  date: string;
  amount: number;
  type: "in" | "out";
};
const data: Transaction[] = [
  {
    id: "TRX-261108-01",
    title: "Pengembalian dana pesanan",
    detail: "Pesanan #SGH-261019",
    date: "8 Nov 2026, 10.32",
    amount: 75000,
    type: "in",
  },
  {
    id: "TRX-261106-02",
    title: "Pembayaran survei kos",
    detail: "Pesanan #SGH-261102",
    date: "6 Nov 2026, 09.15",
    amount: 150000,
    type: "out",
  },
  {
    id: "TRX-261030-03",
    title: "Top up saldo CKIN",
    detail: "Transfer bank",
    date: "30 Okt 2026, 14.08",
    amount: 300000,
    type: "in",
  },
  {
    id: "TRX-261024-04",
    title: "Pembayaran survei kos",
    detail: "Pesanan #SGH-261024",
    date: "24 Okt 2026, 08.42",
    amount: 225000,
    type: "out",
  },
  {
    id: "TRX-261020-05",
    title: "Top up saldo CKIN",
    detail: "Virtual account",
    date: "20 Okt 2026, 16.20",
    amount: 350000,
    type: "in",
  },
];
const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export default function CustomerWalletPage() {
  const [filter, setFilter] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      data.filter(
        (x) =>
          (filter === "Semua" ||
            (filter === "Masuk" ? x.type === "in" : x.type === "out")) &&
          `${x.title} ${x.detail} ${x.id}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [filter, query],
  );
  const totalIn = data
    .filter((x) => x.type === "in")
    .reduce((sum, x) => sum + x.amount, 0);
  const totalOut = data
    .filter((x) => x.type === "out")
    .reduce((sum, x) => sum + x.amount, 0);
  const balance = totalIn - totalOut;
  return (
    <main className="customer-main wallet-page">
      <div className="wallet-heading">
        <div>
          <p className="eyebrow">Keuangan saya</p>
          <h1>Saldo CKIN</h1>
          <p>Pantau saldo dan seluruh transaksi akunmu.</p>
        </div>
        <Link className="wallet-back" href="/">
          ← Kembali ke dashboard
        </Link>
      </div>
      <section className="wallet-balance-card">
        <div>
          <span className="wallet-overline">TOTAL SALDO TERSEDIA</span>
          <strong>{rupiah(balance)}</strong>
          <p>Saldo dapat digunakan untuk pembayaran layanan survei CKIN.</p>
        </div>
        <div className="wallet-card-mark">
          CKIN<span>WALLET</span>
        </div>
      </section>
      <section className="wallet-summary">
        <article>
          <span>Total saldo masuk</span>
          <strong>{rupiah(totalIn)}</strong>
          <small>Akumulasi top up dan pengembalian</small>
        </article>
        <article>
          <span>Total saldo keluar</span>
          <strong>{rupiah(totalOut)}</strong>
          <small>Pembayaran layanan survei</small>
        </article>
        <article>
          <span>Jumlah transaksi</span>
          <strong>{data.length}</strong>
          <small>Transaksi tercatat</small>
        </article>
      </section>
      <section className="wallet-history">
        <div className="wallet-history-head">
          <div>
            <h2>Riwayat saldo</h2>
            <p>Semua aktivitas saldo CKIN kamu.</p>
          </div>
          <span>{rows.length} transaksi</span>
        </div>
        <div className="wallet-tools">
          <div className="wallet-filter">
            {(["Semua", "Masuk", "Keluar"] as const).map((x) => (
              <button
                key={x}
                className={filter === x ? "active" : ""}
                onClick={() => setFilter(x)}
              >
                {x}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari transaksi..."
            aria-label="Cari transaksi"
          />
        </div>
        <div className="wallet-transaction-list">
          {rows.map((x) => (
            <article className="wallet-transaction" key={x.id}>
              <div className={`wallet-transaction-icon ${x.type}`}>
                {x.type === "in" ? "↓" : "↑"}
              </div>
              <div className="wallet-transaction-copy">
                <strong>{x.title}</strong>
                <span>{x.detail}</span>
                <small>
                  {x.date} · {x.id}
                </small>
              </div>
              <div className="wallet-transaction-amount">
                <strong
                  className={x.type === "in" ? "amount-in" : "amount-out"}
                >
                  {x.type === "in" ? "+" : "−"}
                  {rupiah(x.amount)}
                </strong>
                <span className="transaction-status">Berhasil</span>
              </div>
            </article>
          ))}
          {!rows.length && (
            <div className="wallet-empty">
              Tidak ada transaksi yang cocok dengan pencarianmu.
            </div>
          )}
        </div>
        <p className="wallet-footnote">
          Data riwayat ini masih contoh dan akan diganti dengan data wallet dari
          backend.
        </p>
      </section>
    </main>
  );
}
