"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { targetSchema } from "@/src/schemas/order";
import { saveDraft, useDraft, type OrderDraft } from "./draft";
import { BackLink, OrderPage, OrderSummaryCard, locationLabel, useRequireDraft } from "./OrderFlow";

type Target = NonNullable<OrderDraft["targets"]>[number];
const empty = (): Target => ({ propertyName: "", address: "", googleMapsUrls: "", ownerContact: "" });

/** Langkah 2c — daftar kos pilihan customer (layanan USER_CHOICE). */
export default function TargetsStep() {
  const router = useRouter();
  const draft = useDraft();
  useRequireDraft(draft, ["surveyLocation", "kosCount"]);
  const count = draft?.kosCount ?? 1;
  const [targets, setTargets] = useState<Target[]>([empty()]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!draft) return;
    const n = draft.kosCount ?? 1;
    setTargets(Array.from({ length: n }, (_, i) => draft.targets?.[i] ?? empty()));
    if (draft.serviceType === "USER_CHOICE") setNotes(draft.requirements?.notes ?? "");
  }, [draft]);

  function patch(index: number, key: keyof Target, value: string) {
    setTargets((list) => list.map((t, i) => (i === index ? { ...t, [key]: value } : t)));
    setErrors((prev) => ({ ...prev, [`${index}.${key}`]: "" }));
  }

  const complete = targets.filter((t) => t.propertyName.trim() && t.address.trim().length >= 5).length;

  function next() {
    const nextErrors: Record<string, string> = {};
    targets.forEach((target, index) => {
      const result = targetSchema.safeParse(target);
      if (!result.success) {
        for (const issue of result.error.issues) {
          nextErrors[`${index}.${String(issue.path[0])}`] ??= issue.message;
        }
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    saveDraft({ serviceType: "USER_CHOICE", targets, requirements: { notes } });
    router.push("/customer/orders/new/jadwal");
  }

  const field = (index: number, key: keyof Target) => errors[`${index}.${key}`];

  return (
    <OrderPage
      eyebrow="Kos pilihan sendiri"
      title="Masukkan kos incaranmu."
      subtitle={`Surveyor akan mengecek ${count} kos ini secara langsung. Pastikan lokasinya ada di area ${locationLabel(draft).title}.`}
      step={1}
    >
      <div className="two-col">
        <div className="stack">
          <div className="alert alert-info">
            <Icon name="info" size={18} />
            <div>
              <strong style={{ fontWeight: 500 }}>
                {complete} dari {count} kos sudah ditambahkan
              </strong>
              Nama dan alamat wajib diisi. Tautan serta kontak pemilik membantu surveyor mengatur kunjungan.
            </div>
          </div>

          {targets.map((target, index) => (
            <section className="card" key={index}>
              <div className="target-head">
                <span className="num">{String(index + 1).padStart(2, "0")}</span> Detail kos
              </div>
              <div className="form-grid">
                <div className="field">
                  <label className="label" htmlFor={`t-name-${index}`}>
                    Nama kos *
                  </label>
                  <input
                    id={`t-name-${index}`}
                    className="input"
                    placeholder="Contoh: Kos Griya Soka"
                    value={target.propertyName}
                    onChange={(e) => patch(index, "propertyName", e.target.value)}
                    aria-invalid={Boolean(field(index, "propertyName")) || undefined}
                  />
                  {field(index, "propertyName") && <span className="field-error">{field(index, "propertyName")}</span>}
                </div>
                <div className="field">
                  <label className="label" htmlFor={`t-owner-${index}`}>
                    Kontak pemilik (opsional)
                  </label>
                  <input
                    id={`t-owner-${index}`}
                    className="input"
                    placeholder="Bu Rini · 0812 8844 1200"
                    value={target.ownerContact}
                    onChange={(e) => patch(index, "ownerContact", e.target.value)}
                  />
                </div>
                <div className="field span-2">
                  <label className="label" htmlFor={`t-addr-${index}`}>
                    Alamat lengkap *
                  </label>
                  <div className="input-wrap">
                    <Icon name="pin" size={17} />
                    <input
                      id={`t-addr-${index}`}
                      className="input"
                      placeholder="Nama jalan, nomor, kelurahan"
                      value={target.address}
                      onChange={(e) => patch(index, "address", e.target.value)}
                      aria-invalid={Boolean(field(index, "address")) || undefined}
                    />
                  </div>
                  {field(index, "address") && <span className="field-error">{field(index, "address")}</span>}
                </div>
                <div className="field span-2">
                  <label className="label" htmlFor={`t-link-${index}`}>
                    Tautan kos / Google Maps
                  </label>
                  <div className="input-wrap">
                    <Icon name="arrowUpRight" size={17} />
                    <input
                      id={`t-link-${index}`}
                      className="input"
                      placeholder="https://maps.app.goo.gl/…"
                      value={target.googleMapsUrls}
                      onChange={(e) => patch(index, "googleMapsUrls", e.target.value)}
                      aria-invalid={Boolean(field(index, "googleMapsUrls")) || undefined}
                    />
                  </div>
                  {field(index, "googleMapsUrls") && (
                    <span className="field-error">{field(index, "googleMapsUrls")}</span>
                  )}
                </div>
              </div>
            </section>
          ))}

          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>
              Catatan tambahan
            </h2>
            <label className="label" htmlFor="t-notes" style={{ display: "block", marginBottom: 8 }}>
              Hal yang perlu dicek secara khusus
            </label>
            <textarea
              id="t-notes"
              className="textarea"
              maxLength={500}
              placeholder="Contoh: tanyakan ketersediaan kamar, biaya listrik & Wi-Fi, aturan tamu…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          <div>
            <BackLink href="/customer/orders/new/sumber-kos">Kembali ke pilihan kos</BackLink>
          </div>
        </div>

        <aside className="stack">
          <OrderSummaryCard
            draft={draft ? { ...draft, serviceType: "USER_CHOICE" } : null}
            action={
              <button type="button" className="btn btn-primary btn-block" onClick={next}>
                <Icon name="arrowRight" size={16} /> Lanjut pilih jadwal
              </button>
            }
          />
          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>
              Daftar kos siap disurvei
            </h2>
            <ul className="check-list" style={{ color: "var(--ink)", marginBottom: 0 }}>
              {targets.map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 10 }}>
                  <Icon
                    name={t.propertyName && t.address.length >= 5 ? "checkCircle" : "info"}
                    size={16}
                    style={{ color: t.propertyName && t.address.length >= 5 ? "var(--accent)" : "var(--muted-2)", flex: "0 0 auto" }}
                  />
                  <span>
                    {t.propertyName || `Kos ${i + 1}`}
                    <small style={{ display: "block", color: "var(--muted)" }}>
                      {t.address ? "Lokasi lengkap" : "Alamat belum diisi"}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </OrderPage>
  );
}
