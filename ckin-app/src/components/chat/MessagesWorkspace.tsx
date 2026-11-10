"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { firstName, formatDate, formatRelativeShort, initials } from "@/src/lib/format";
import type { ConversationSummary } from "@/src/types/customer";
import { Composer, MessageList } from "./ChatParts";
import { useConversation } from "./useConversation";

/**
 * Halaman "Pesan" (Figma Olga) — dipakai customer & surveyor.
 * Kiri: daftar percakapan per order. Kanan: isi percakapan.
 */
export default function MessagesWorkspace({ orderId }: { orderId?: string }) {
  const { role, socket } = useWorkspace();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [query, setQuery] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const base = `/${role}/messages`;

  const loadList = useCallback(async () => {
    try {
      const data = await apiFetch<{ conversations: ConversationSummary[] }>("/api/conversations");
      setConversations(data.conversations);
      setListError("");
    } catch (err) {
      setListError(errorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Perbarui daftar saat ada pesan baru dari percakapan lain.
  useEffect(() => {
    if (!socket) return;
    const refresh = () => loadList();
    socket.on("conversation:updated", refresh);
    socket.on("message:new", refresh);
    return () => {
      socket.off("conversation:updated", refresh);
      socket.off("message:new", refresh);
    };
  }, [socket, loadList]);

  // Desktop: buka percakapan teratas otomatis bila belum memilih.
  useEffect(() => {
    if (!orderId && conversations.length > 0 && window.matchMedia("(min-width: 901px)").matches) {
      router.replace(`${base}/${conversations[0].orderId}`);
    }
  }, [orderId, conversations, base, router]);

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter(
      (c) =>
        (!onlyUnread || c.unread > 0) &&
        (!q || `${c.peer.name} ${c.orderCode} ${c.location}`.toLowerCase().includes(q)),
    );
  }, [conversations, query, onlyUnread]);

  const conversation = useConversation(orderId ?? null);
  const active = conversation.thread?.conversation;

  // Setelah percakapan dibuka, unread di daftar kiri ikut direset.
  useEffect(() => {
    if (!active) return;
    setConversations((prev) => prev.map((c) => (c.orderId === active.orderId ? { ...c, unread: 0 } : c)));
  }, [active]);

  async function handleSend(text: string, image: File | null) {
    const ok = await conversation.send(text, image);
    if (ok) loadList();
    return ok;
  }

  return (
    <>
      <PageHeader
        eyebrow={role === "customer" ? "Ruang pengguna" : "Ruang surveyor"}
        title="Pesan"
        subtitle={
          role === "customer"
            ? "Tetap terhubung dengan surveyor, dari kunjungan hingga laporan."
            : "Koordinasikan kebutuhan customer dan kabarkan progres surveimu."
        }
      />

      <div className={`chat-layout ${orderId ? "thread-open" : ""}`}>
        <section className="chat-list" aria-label="Daftar percakapan">
          <div className="chat-list-head">
            <div className="row">
              <h2>Percakapan</h2>
              {unreadTotal > 0 && <StatusPill tone="success">{unreadTotal} baru</StatusPill>}
            </div>
            <div className="input-wrap chat-search">
              <Icon name="search" size={16} />
              <input
                className="input"
                placeholder={role === "customer" ? "Cari percakapan…" : "Cari customer…"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Cari percakapan"
              />
            </div>
            <div className="tabs">
              <button type="button" className={`tab ${!onlyUnread ? "active" : ""}`} onClick={() => setOnlyUnread(false)}>
                Semua
              </button>
              <button type="button" className={`tab ${onlyUnread ? "active" : ""}`} onClick={() => setOnlyUnread(true)}>
                Belum dibaca ({unreadTotal})
              </button>
            </div>
          </div>

          <div className="chat-items">
            {listLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div className="chat-item" key={i}>
                  <Skeleton height={36} width={36} style={{ borderRadius: "50%" }} />
                  <div className="body">
                    <Skeleton height={12} width="60%" />
                    <Skeleton height={10} style={{ marginTop: 8 }} />
                  </div>
                </div>
              ))}
            {listError && (
              <div style={{ padding: 16 }}>
                <ErrorState message={listError} onRetry={loadList} />
              </div>
            )}
            {!listLoading && !listError && visible.length === 0 && (
              <div className="empty" style={{ padding: "30px 18px" }}>
                {conversations.length === 0
                  ? role === "customer"
                    ? "Percakapan muncul setelah surveyor mengambil pesananmu."
                    : "Percakapan muncul setelah kamu mengambil order."
                  : "Tidak ada percakapan yang cocok."}
              </div>
            )}
            {visible.map((c) => (
              <Link
                key={c.orderId}
                href={`${base}/${c.orderId}`}
                className={`chat-item ${c.orderId === orderId ? "active" : ""}`}
              >
                <span className="avatar lime">{initials(c.peer.name)}</span>
                <span className="body">
                  <span className="top">
                    <strong>{c.peer.name}</strong>
                    <time>{formatRelativeShort(c.lastMessage?.createdAt ?? c.updatedAt)}</time>
                  </span>
                  <p>
                    {c.lastMessage
                      ? `${c.lastMessage.senderRole === role ? "Kamu: " : ""}${c.lastMessage.text}`
                      : "Belum ada pesan"}
                  </p>
                  <span className="top">
                    <span className="ctx">
                      #{c.orderCode} · {c.statusLabel}
                    </span>
                    {c.unread > 0 && <span className="unread">{c.unread}</span>}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="chat-safe">
            <Icon name="shield" size={18} />
            <p>Simpan komunikasi di CKIN agar riwayat survei tetap tercatat.</p>
          </div>
        </section>

        <section className="chat-thread" aria-label="Isi percakapan">
          {!orderId && (
            <div className="chat-empty">
              <Icon name="chat" size={28} />
              <strong>Pilih percakapan</strong>
              <span>Pesan dengan {role === "customer" ? "surveyor" : "customer"} muncul di sini.</span>
            </div>
          )}

          {orderId && conversation.loading && (
            <div className="chat-empty">
              <span className="spinner" />
            </div>
          )}

          {orderId && !conversation.loading && conversation.error && !active && (
            <div className="chat-empty">
              <Icon name="alert" size={26} />
              <strong>Percakapan tidak tersedia</strong>
              <span>{conversation.error}</span>
              <Link className="btn btn-secondary btn-sm" href={base}>
                Kembali ke daftar
              </Link>
            </div>
          )}

          {active && conversation.thread && (
            <>
              <header className="chat-thread-head">
                <Link href={base} className="icon-btn menu-toggle" aria-label="Kembali ke daftar percakapan">
                  <Icon name="arrowLeft" size={18} />
                </Link>
                <span className="avatar">{initials(active.peer.name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{active.peer.name}</strong>
                  <small>{active.peer.role === "surveyor" ? "Surveyor" : "Customer"}</small>
                </div>
                <span className={`conn ${conversation.live ? "live" : ""}`}>
                  {conversation.live ? "Real-time" : "Sinkron berkala"}
                </span>
              </header>

              <div className="chat-context">
                <Icon name="clipboard" size={20} />
                <div className="text">
                  <strong>
                    #{active.orderCode} · {active.location} · {active.kosCount} kos
                  </strong>
                  <small>
                    {formatDate(active.surveyDate)}
                    {active.surveyTimeSlot ? ` · ${active.surveyTimeSlot}` : ""} · {active.payment}
                  </small>
                </div>
                <StatusPill tone={active.statusTone}>{active.statusLabel}</StatusPill>
                <Link
                  className="btn btn-secondary btn-sm"
                  href={role === "customer" ? `/customer/orders/${active.orderId}` : `/surveyor/orders/${active.orderId}`}
                >
                  {role === "customer" ? "Lihat progres" : "Kelola survei"}
                </Link>
              </div>

              <div className="chat-messages" aria-live="polite">
                {conversation.thread.messages.length === 0 && (
                  <div className="chat-empty">
                    <strong>Mulai percakapan</strong>
                    <span>Sapa {firstName(active.peer.name)} dan sampaikan hal penting tentang survei ini.</span>
                  </div>
                )}
                <MessageList
                  messages={conversation.thread.messages}
                  myRole={role === "surveyor" ? "surveyor" : "customer"}
                  typing={conversation.peerTyping}
                />
              </div>

              {conversation.error && (
                <p className="field-error" style={{ padding: "0 18px" }}>
                  {conversation.error}
                </p>
              )}
              <Composer
                placeholder={`Tulis pesan untuk ${firstName(active.peer.name)}…`}
                sending={conversation.sending}
                onSend={handleSend}
                onTyping={conversation.notifyTyping}
                disabled={active.status === "CANCELLED" || active.status === "EXPIRED"}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
