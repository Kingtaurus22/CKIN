"use client";
import Link from "next/link";
import { useState } from "react";
import { customerOrders } from "@/src/lib/customer-orders";
type Role = "customer" | "surveyor";
export default function ChatWorkspace({
  id,
  role,
}: {
  id: string;
  role: Role;
}) {
  const order = customerOrders.find((x) => x.id === id);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: role === "customer" ? "surveyor" : "customer",
      text:
        role === "customer"
          ? "Halo! Saya siap membantu proses survei kos kamu."
          : "Halo, Kak. Apakah ada perkembangan terkait survei kos saya?",
      time: "09.00",
    },
    {
      id: 2,
      sender: role,
      text:
        role === "customer"
          ? "Baik, terima kasih. Mohon kabari jika sudah ada perkembangan."
          : "Baik, saya akan mengirimkan kabar setelah survei selesai.",
      time: "09.05",
    },
  ]);
  if (!order)
    return (
      <main className="customer-main">
        <h1>Pesanan tidak ditemukan</h1>
        <Link href="/">Kembali ke dashboard</Link>
      </main>
    );
  const customer = role === "customer";
  const peer = customer
    ? (order.surveyor ?? "Menunggu surveyor")
    : "Alya Putri";
  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setMessages((old) => [
      ...old,
      {
        id: Date.now(),
        sender: role,
        text: value,
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setDraft("");
  }
  return (
    <main className="customer-main chat-page">
      <Link className="orders-back-link" href="/">
        ← Kembali ke dashboard
      </Link>
      <section className="chat-card">
        <header className="chat-heading">
          <div className="chat-avatar">
            {peer
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <h1>{peer}</h1>
            <p>
              {customer ? "Surveyor" : "Customer"} · Pesanan #{order.id}
            </p>
          </div>
          <span className="chat-online">
            {customer ? "Mode customer" : "Mode surveyor"}
          </span>
        </header>
        <div className="chat-order-context">
          <strong>Pesanan #{order.id}</strong>
          <span>
            {order.location} · {order.surveyDate}
          </span>
        </div>
        <div className="chat-messages" aria-live="polite">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-message ${m.sender === role ? "customer" : ""}`}
            >
              <p>{m.text}</p>
              <time>{m.time}</time>
            </div>
          ))}
        </div>
        <form className="chat-compose" onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tulis pesan..."
            aria-label="Tulis pesan"
          />
          <button type="submit" disabled={!draft.trim()}>
            Kirim ↗
          </button>
        </form>
        <p className="chat-note">
          Mode demo lokal · Pesan hanya tersimpan selama halaman terbuka.
          Firebase Realtime Database akan diaktifkan pada tahap integrasi.
        </p>
      </section>
    </main>
  );
}
