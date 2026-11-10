"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { formatDate, formatRupiah } from "@/src/lib/format";
import { createOrderSchema } from "@/src/schemas/order";
import { clearDraft, toOrderPayload, useDraft } from "./draft";
import { BackLink, OrderPage, OrderSummaryCard, locationLabel, useRequireDraft } from "./OrderFlow";

const GENDER = { FEMALE: "Kos putri", MALE: "Kos putra", ANY: "Kos campur" } as const;

/** Langkah 4 — konfirmasi lalu buat pesanan (status PENDING_PAYMENT). */
export default function ReviewStep() {
  const router = useRouter();
  const draft = useDraft();
  useRequireDraft(draft, ["surveyLocation", "kosCount", "serviceType", "surveyDate"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!draft) return;
    setError("");
    const payload = toOrderPayload(draft);
    const check = createOrderSchema.safeParse(payload);
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? "Data pesanan belum lengkap.");
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch<{ id: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify(check.data),
      });
      clearDraft();
      router.push(`/customer/orders/${data.id}/payment`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (!draft?.serviceType) {
    return (
      <OrderPage eyebrow="Konfirmasi pesanan" title="Periksa pesananmu." subtitle="Memuat detail pesanan…" step={3}>
        <div className="skeleton" style={{ height: 240 }} />
      </OrderPage>
    );
  }

  const choice = draft.serviceType === "USER_CHOICE";
  const req = draft.requirements ?? {};
  const loc = locationLabel(draft);

  return (
    <OrderPage
      eyebrow="Konfirmasi pesanan"
      title="Periksa pesananmu."
      subtitle="Pastikan seluruh informasi sudah benar sebelum membuat pesanan."
      step={3}
    >
      <div className="two-col">
        <div className="stack">
          <div className="alert alert-warning">
            <Icon name="info" size={18} />
            <div>
              <strong>Pesanan dibuat dengan status menunggu pembayaran.</strong>
              Selesaikan pembayaran dalam 24 jam agar jadwal survei dikonfirmasi.
            </div>
          </div>

          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 22 }}>
              Detail survei
            </h2>
            <div className="info-grid">
              <div className="info-row">
                <span>Lokasi</span>
                <strong>{loc.title}</strong>
              </div>
              <div className="info-row">
                <span>Tanggal survei</span>
                <strong>{formatDate(draft.surveyDate, "long")}</strong>
              </div>
              <div className="info-row">
                <span>Jumlah kos</span>
                <strong>{draft.kosCount} kos</strong>
              </div>
              <div className="info-row">
                <span>Pilihan kos</span>
                <strong>{choice ? "Pilihan sendiri" : "Rekomendasi surveyor"}</strong>
              </div>
              <div className="info-row">
                <span>Rencana masuk</span>
                <strong>{formatDate(draft.moveInDate, "long")}</strong>
              </div>
            </div>
          </section>

          {choice ? (
            <section className="card">
              <h2 className="card-title" style={{ marginBottom: 18 }}>
                Kos pilihanmu
              </h2>
              <div className="stack" style={{ gap: 10 }}>
                {(draft.targets ?? []).map((t, i) => (
                  <div key={i} className="note-box">
                    <strong>
                      {i + 1}. {t.propertyName}
                    </strong>
                    {t.address}
                    {t.ownerContact && <div>Kontak: {t.ownerContact}</div>}
                    {t.googleMapsUrls && (
                      <a className="text-link" href={t.googleMapsUrls} target="_blank" rel="noreferrer" style={{ marginTop: 6 }}>
                        Buka tautan ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {req.notes && (
                <div className="note-box" style={{ marginTop: 14 }}>
                  <strong>Catatan untuk surveyor</strong>
                  {req.notes}
                </div>
              )}
            </section>
          ) : (
            <section className="card">
              <h2 className="card-title" style={{ marginBottom: 18 }}>
                Preferensi kos
              </h2>
              <div className="tag-row">
                {req.genderPreferences && <span className="pill">{GENDER[req.genderPreferences]}</span>}
                {req.budget && (
                  <span className="pill">
                    {formatRupiah(req.budget.min)}–{formatRupiah(req.budget.max)} / bulan
                  </span>
                )}
              </div>
              {req.facilities && req.facilities.length > 0 && (
                <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
                  {req.facilities.join(" · ")}
                </p>
              )}
              {req.notes && (
                <div className="note-box">
                  <strong>Catatan untuk surveyor</strong>
                  {req.notes}
                </div>
              )}
            </section>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert" size={17} />
              <span>{error}</span>
            </div>
          )}
          <div>
            <BackLink href="/customer/orders/new/jadwal">Ubah jadwal</BackLink>
          </div>
        </div>

        <aside>
          <OrderSummaryCard
            draft={draft}
            note="Kamu akan memilih metode pembayaran di langkah berikutnya."
            action={
              <button type="button" className="btn btn-primary btn-block" onClick={create} disabled={busy}>
                {busy ? <span className="spinner" /> : <Icon name="arrowRight" size={16} />}
                {busy ? "Membuat pesanan…" : "Buat pesanan & lanjut bayar"}
              </button>
            }
          />
        </aside>
      </div>
    </OrderPage>
  );
}
