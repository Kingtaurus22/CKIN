"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Composer, MessageList } from "@/src/components/chat/ChatParts";
import { useConversation } from "@/src/components/chat/useConversation";
import Icon from "@/src/components/ui/Icon";
import { ConfirmModal, ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { apiFetch, ClientApiError, errorMessage } from "@/src/lib/client-api";
import { formatDate, formatDateTime, formatRupiah, initials, regionLabel } from "@/src/lib/format";
import type { CustomerOrderDetail as Detail } from "@/src/types/customer";

function headline(order: Detail) {
  switch (order.status) {
    case "PENDING_PAYMENT":
      return "Satu langkah lagi sebelum survei.";
    case "WAITING_SURVEYOR":
      return "Pembayaran diterima. Mencari surveyor.";
    case "ASSIGNED":
    case "IN_PROGRESS":
      return "Surveyor sedang mengecek kosmu.";
    case "REPORT_SUBMITTED":
      return "Laporan sudah masuk. Saatnya memilih.";
    case "COMPLETED":
      return "Survei selesai. Semoga betah di kos baru!";
    case "CANCELLED":
      return "Pesanan ini telah dibatalkan.";
    default:
      return "Pesanan ini sudah kedaluwarsa.";
  }
}

function budgetLabel(budget: Detail["requirements"]["budget"]) {
  if (!budget || (!budget.min && !budget.max)) return null;
  const juta = (n?: number) => (n ? `${(n / 1_000_000).toLocaleString("id-ID")}` : "");
  if (budget.min && budget.max) return `Rp${juta(budget.min)}–${juta(budget.max)} juta / bulan`;
  return budget.max ? `Maks. Rp${juta(budget.max)} juta / bulan` : `Mulai Rp${juta(budget.min)} juta / bulan`;
}

function genderLabel(value: string | null) {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.includes("putri") || v.includes("female") || v.includes("perempuan")) return "Kos putri";
  if (v.includes("putra") || v.includes("male") || v.includes("laki")) return "Kos putra";
  if (v.includes("campur") || v.includes("mix")) return "Kos campur";
  return value;
}

function ForumCard({ order }: { order: Detail }) {
  const { thread, loading, error, sending, send, peerTyping, notifyTyping } = useConversation(
    order.canChat ? order.id : null,
  );

  return (
    <section className="card">
      <h2 className="card-title">Forum pesanan</h2>
      <p className="card-sub">Diskusi bersama surveyor &amp; tim CKIN.</p>

      {!order.surveyorDetail ? (
        <div className="note-box" style={{ marginTop: 18 }}>
          Chat dengan surveyor aktif setelah pembayaran berhasil dan surveyor mengambil pesananmu.
        </div>
      ) : (
        <>
          <div className="surveyor-row" style={{ marginTop: 18 }}>
            <span className="avatar">{initials(order.surveyorDetail.name)}</span>
            <div>
              <strong>{order.surveyorDetail.name}</strong>
              <small>Surveyor kamu</small>
            </div>
          </div>
          {order.canChat ? (
            <>
              <div className="mini-chat" aria-live="polite">
                {loading && <Skeleton height={56} />}
                {thread && thread.messages.length === 0 && (
                  <p className="hint">Belum ada pesan. Sapa surveyormu dan sampaikan kebutuhan khusus.</p>
                )}
                {thread && (
                  <MessageList messages={thread.messages.slice(-4)} myRole="customer" typing={peerTyping} compact />
                )}
              </div>
              {error && <p className="field-error" style={{ marginBottom: 8 }}>{error}</p>}
              <Composer placeholder="Tulis pesan…" sending={sending} onSend={send} onTyping={notifyTyping} compact />
              <Link className="text-link" style={{ marginTop: 14 }} href={`/customer/messages/${order.id}`}>
                Buka percakapan lengkap <Icon name="arrowUpRight" size={13} />
              </Link>
            </>
          ) : (
            <div className="note-box" style={{ marginTop: 16 }}>
              Percakapan ditutup karena pesanan tidak dilanjutkan.
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function CustomerOrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [refundNotice, setRefundNotice] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      let data = await apiFetch<{ order: Detail }>(`/api/customer/orders/${id}`);
      // Belum lunas? Tanyakan status terbaru ke Midtrans (berguna saat webhook
      // belum bisa menjangkau server, mis. development di localhost).
      if (data.order.status === "PENDING_PAYMENT") {
        const sync = await apiFetch<{ changed: boolean }>("/api/payments/sync", {
          method: "POST",
          body: JSON.stringify({ orderId: id }),
        }).catch(() => null);
        if (sync?.changed) data = await apiFetch<{ order: Detail }>(`/api/customer/orders/${id}`);
      }
      setOrder(data.order);
    } catch (err) {
      if (err instanceof ClientApiError && err.status === 404) setNotFound(true);
      else setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelOrder() {
    setCancelling(true);
    setCancelError("");
    try {
      const res = await apiFetch<{ refunded?: number }>(`/api/customer/orders/${id}/cancel`, { method: "PATCH" });
      setCancelOpen(false);
      setRefundNotice(res.refunded ? res.refunded : null);
      await load();
    } catch (err) {
      setCancelError(errorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  if (notFound) {
    return (
      <div className="card empty">
        <strong>Pesanan tidak ditemukan</strong>
        <p>Pesanan ini tidak ada atau bukan milik akunmu.</p>
        <Link className="btn btn-primary btn-sm" href="/customer/orders">
          Kembali ke pesanan saya
        </Link>
      </div>
    );
  }

  if (loading || !order) {
    return (
      <div className="stack">
        <Skeleton height={14} width={120} />
        <Skeleton height={34} width="50%" />
        {error ? <ErrorState message={error} onRetry={load} /> : <Skeleton height={260} />}
      </div>
    );
  }

  const unpaid = order.status === "PENDING_PAYMENT";
  const req = order.requirements;
  const tags = [genderLabel(req.genderPreferences), budgetLabel(req.budget), req.landmark ? `Dekat ${req.landmark}` : null].filter(
    Boolean,
  ) as string[];
  const reportReady = order.hasReport;

  return (
    <>
      <PageHeader
        eyebrow="Detail pesanan"
        title={headline(order)}
        subtitle={`Pesanan #${order.code} · Dibuat ${formatDateTime(order.createdAt)}`}
        actions={<StatusPill tone={order.statusTone}>{order.statusLabel}</StatusPill>}
      />

      {unpaid && (
        <div className="alert alert-warning" style={{ marginBottom: 22 }}>
          <Icon name="info" size={18} />
          <div>
            <strong>
              {order.expiresAt
                ? `Selesaikan pembayaran sebelum ${formatDateTime(order.expiresAt)}`
                : "Selesaikan pembayaran untuk melanjutkan pesanan"}
            </strong>
            Pesanan kedaluwarsa otomatis jika belum dibayar. Jadwal survei baru dikonfirmasi setelah
            pembayaran berhasil.
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="stack">
          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 22 }}>
              Detail survei
            </h2>
            <div className="info-grid">
              <div className="info-row">
                <span>Lokasi</span>
                <strong>{order.location}</strong>
              </div>
              <div className="info-row">
                <span>Tanggal survei</span>
                <strong>{formatDate(order.surveyDate, "long")}</strong>
              </div>
              <div className="info-row">
                <span>Jumlah kos</span>
                <strong>{order.kosCount} kos</strong>
              </div>
              <div className="info-row">
                <span>Waktu</span>
                <strong>{order.surveyTimeSlot ?? "Menyesuaikan surveyor"}</strong>
              </div>
              <div className="info-row">
                <span>Pilihan kos</span>
                <strong>{order.serviceType}</strong>
              </div>
              <div className="info-row">
                <span>Surveyor</span>
                <strong className={order.surveyor ? "" : "pending"}>
                  {order.surveyor?.name ?? "Menunggu surveyor"}
                </strong>
              </div>
              {order.moveInDate && (
                <div className="info-row">
                  <span>Rencana masuk</span>
                  <strong>{formatDate(order.moveInDate, "long")}</strong>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 20 }}>
              {order.serviceType === "Pilihan pengguna" ? "Kos pilihanmu" : "Preferensi kos"}
            </h2>
            {tags.length > 0 && (
              <div className="tag-row">
                {tags.map((tag) => (
                  <span className="pill" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {order.targets.length > 0 && (
              <ul className="history" style={{ borderTop: 0, paddingTop: 0, marginTop: 0, marginBottom: 18 }}>
                {order.targets.map((target, index) => (
                  <li key={`${target.name}-${index}`}>
                    <span>
                      <strong style={{ fontWeight: 500 }}>{target.name ?? `Kos ${index + 1}`}</strong>
                      {target.address && <span className="note">{target.address}</span>}
                    </span>
                    {target.link ? (
                      <a className="text-link" href={target.link} target="_blank" rel="noreferrer">
                        Lihat ↗
                      </a>
                    ) : (
                      <span />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {req.facilities.length > 0 && (
              <p className="muted" style={{ fontSize: 13.5, marginBottom: 18 }}>
                {req.facilities.join(" · ")}
              </p>
            )}
            {req.notes && (
              <div className="note-box">
                <strong>Catatan untuk {order.surveyor?.name.split(" ")[0] ?? "surveyor"}</strong>
                {req.notes}
              </div>
            )}
            {tags.length === 0 && req.facilities.length === 0 && !req.notes && order.targets.length === 0 && (
              <p className="muted">Tidak ada preferensi tambahan.</p>
            )}
          </section>

          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 22 }}>
              Perjalanan pesanan
            </h2>
            <div className="journey">
              {order.journey.map((step, index) => (
                <div key={step.key} className={`journey-step ${step.state}`}>
                  <span className="num">
                    {step.state === "done" ? <Icon name="check" size={13} strokeWidth={2.2} /> : index + 1}
                  </span>
                  <strong>{step.label}</strong>
                  <small>{step.caption}</small>
                </div>
              ))}
            </div>
            {order.history.length > 0 && (
              <ul className="history" aria-label="Riwayat status">
                {order.history.map((entry, index) => (
                  <li key={`${entry.at}-${index}`}>
                    <span>
                      {entry.label}
                      {entry.note && <span className="note">{entry.note}</span>}
                    </span>
                    <small>{formatDateTime(entry.at)}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="report-cta">
              <Icon name="report" size={26} />
              <div>
                <h3>{reportReady ? "Laporan survei sudah tersedia" : "Laporan survei belum tersedia"}</h3>
                <p>
                  {reportReady
                    ? "Lihat foto, video, temuan, dan catatan surveyor untuk setiap kos."
                    : "Foto, video, dan temuan akan muncul setelah surveyor mengirim laporan. Setelah itu kamu bisa memberi ulasan."}
                </p>
              </div>
            </div>
            {reportReady ? (
              <div className="btn-pair" style={{ marginTop: 18 }}>
                <Link className="btn btn-primary" href={`/customer/reports/${order.id}`}>
                  <Icon name="report" size={16} /> Lihat laporan
                </Link>
                <Link className="btn btn-secondary" href={`/customer/reports/${order.id}#ulasan`}>
                  <Icon name="star" size={16} /> Ulasan
                </Link>
              </div>
            ) : (
              <button className="btn btn-soft btn-block" style={{ marginTop: 18 }} disabled>
                <Icon name="report" size={16} /> Laporan &amp; ulasan
              </button>
            )}
          </section>

          {order.canCancel && (
            <button type="button" className="btn-ghost-danger" style={{ alignSelf: "flex-start" }} onClick={() => setCancelOpen(true)}>
              Batalkan pesanan
            </button>
          )}
        </div>

        <aside className="stack">
          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 22 }}>
              Rincian pembayaran
            </h2>
            <div className="pay-row">
              <span>
                Survei {order.kosCount} kos × {formatRupiah(order.pricing.perKos)}
              </span>
              <strong>{formatRupiah(order.pricing.perKos * order.kosCount)}</strong>
            </div>
            <div className="pay-row">
              <span>Biaya layanan</span>
              <strong>{formatRupiah(order.pricing.serviceFee)}</strong>
            </div>
            <div className="pay-total">
              <span>Total</span>
              <strong>{formatRupiah(order.pricing.total)}</strong>
            </div>
            {unpaid ? (
              <>
                <Link className="btn btn-primary btn-block" href={`/customer/orders/${order.id}/payment`}>
                  <Icon name="arrowRight" size={16} /> Bayar sekarang
                </Link>
                <p className="center-note">Pembayaran aman melalui CKIN.</p>
              </>
            ) : (
              <div className={`alert ${order.payment === "Sudah dibayar" ? "alert-success" : "alert-info"}`}>
                <Icon name={order.payment === "Sudah dibayar" ? "checkCircle" : "info"} size={17} />
                <span>
                  {order.payment === "Sudah dibayar"
                    ? "Pembayaran sudah dikonfirmasi."
                    : order.payment === "Dikembalikan"
                      ? "Dana sudah dikembalikan ke saldo CKIN."
                      : "Pesanan tidak dapat dibayar lagi."}
                </span>
              </div>
            )}
          </section>

          {order.surveyorDetail && (
            <section className="card">
              <div className="surveyor-row">
                <span className="avatar lg lime">{initials(order.surveyorDetail.name)}</span>
                <div>
                  <strong>{order.surveyorDetail.name}</strong>
                  <small style={{ color: "var(--muted)" }}>
                    Surveyor · {regionLabel(order.surveyorDetail.district)}
                    {order.surveyorDetail.rating.count > 0 &&
                      ` · ★ ${order.surveyorDetail.rating.average.toLocaleString("id-ID")}`}
                  </small>
                </div>
              </div>
            </section>
          )}

          <ForumCard order={order} />
        </aside>
      </div>

      {refundNotice !== null && (
        <div className="toast" role="status">
          Refund {formatRupiah(refundNotice)} masuk ke Saldo CKIN. <Link href="/customer/wallet">Lihat saldo</Link>
        </div>
      )}

      {cancelOpen && (
        <ConfirmModal
          title="Batalkan pesanan?"
          description={
            order.payment === "Sudah dibayar"
              ? "Pesanan belum diambil surveyor. Pembayaran dikembalikan penuh ke Saldo CKIN dan bisa dipakai untuk pesanan berikutnya."
              : "Pesanan akan dibatalkan dan tidak bisa dibayar lagi."
          }
          confirmLabel="Ya, batalkan"
          loading={cancelling}
          error={cancelError}
          onConfirm={cancelOrder}
          onClose={() => {
            setCancelOpen(false);
            setCancelError("");
          }}
        />
      )}
    </>
  );
}
