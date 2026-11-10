"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent } from "react";
import Icon from "@/src/components/ui/Icon";
import { ConfirmModal, ErrorState, Skeleton, StatusPill } from "@/src/components/ui/common";
import { useWorkspace } from "@/src/components/workspace/WorkspaceProvider";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { firstName, formatDate, formatDateTime, formatRupiah, formatTime, initials, regionLabel, shortCity } from "@/src/lib/format";
import { PRICE_PER_KOS } from "@/src/lib/pricing";
import {
  AVAILABILITY_OPTIONS,
  CHECKLIST_GROUPS,
  CHECKLIST_ITEMS,
  MAX_PHOTO_SIZE,
  MAX_VIDEO_SIZE,
  PHOTO_TYPES,
  VIDEO_TYPES,
} from "@/src/lib/survey";
import type { ReportItemDraft, ReportMediaView, SurveyorOrderDetail } from "@/src/types/surveyor";
import { budgetShort, genderLabel, slotText, useApi } from "./shared";

const TOTAL_CHECKS = CHECKLIST_ITEMS.length;

/** Hal yang masih kurang agar satu kos siap dikirim (sama dengan validasi server). */
function missingFor(item: ReportItemDraft) {
  const list: string[] = [];
  if (!item.kostName.trim()) list.push("nama kos");
  if (!item.address.trim()) list.push("alamat");
  if (!item.price) list.push("harga sewa");
  if (!AVAILABILITY_OPTIONS.includes(item.availability)) list.push("ketersediaan");
  if (item.checkedItems.length < TOTAL_CHECKS) list.push("checklist");
  if (!item.media.some((m) => m.type === "image")) list.push("bukti foto");
  if (item.condition.trim().length < 10) list.push("kondisi & lingkungan");
  return list;
}

function fileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function rupiahInput(value: number | null) {
  return value ? value.toLocaleString("id-ID") : "";
}

type Props = { id: string };

/** Halaman "Kelola survei": progres per kos, checklist, bukti foto/video, dan isi laporan. */
export default function ManageSurvey({ id }: Props) {
  const { user } = useWorkspace();
  const { data, error, loading, reload, setData } = useApi<SurveyorOrderDetail>(`/api/surveyor/orders/${id}`);
  const [items, setItems] = useState<ReportItemDraft[]>([]);
  const [active, setActive] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ReportItemDraft[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!data) return;
    setItems(data.report.items);
    setSavedAt(data.report.updatedAt);
    setDirty(false);
  }, [data]);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("taken")) {
      setNotice("Order berhasil diambil. Selamat bertugas!");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  if (loading && !data) {
    return (
      <div className="stack">
        <Skeleton height={90} />
        <Skeleton height={140} />
        <Skeleton height={320} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <>
        <BackToOrders />
        <ErrorState message={error || "Order tidak ditemukan."} onRetry={reload} />
      </>
    );
  }

  const order = data;
  const editable = order.status === "ASSIGNED" || order.status === "IN_PROGRESS";
  const item = items[active] ?? items[0];
  const customerFirst = firstName(order.customer.name);
  const totalChecked = items.reduce((s, it) => s + it.checkedItems.length, 0);
  const missing = items.map(missingFor);
  const incompleteIndex = missing.findIndex((m) => m.length > 0);
  const ready = items.length > 0 && incompleteIndex === -1;
  const target = order.targets[active];

  function update(patch: Partial<ReportItemDraft>) {
    setItems((list) => list.map((it, i) => (i === active ? { ...it, ...patch } : it)));
    setDirty(true);
    setFormError("");
  }

  function toggleCheck(label: string) {
    if (!item) return;
    const on = item.checkedItems.includes(label);
    update({ checkedItems: on ? item.checkedItems.filter((l) => l !== label) : [...item.checkedItems, label] });
  }

  async function saveDraft(list = itemsRef.current, silent = false) {
    setSaving(true);
    setFormError("");
    try {
      const res = await apiFetch<{ savedAt: string }>(`/api/surveyor/orders/${id}/report`, {
        method: "PUT",
        body: JSON.stringify({ items: list }),
      });
      setSavedAt(res.savedAt);
      setDirty(false);
      if (order.status === "ASSIGNED") {
        setData({ ...order, status: "IN_PROGRESS", statusLabel: "Dalam proses", statusTone: "info" });
      }
      if (!silent) setNotice("Draf laporan tersimpan.");
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const index = active;
    for (const file of Array.from(files)) {
      const isPhoto = PHOTO_TYPES.includes(file.type);
      const isVideo = VIDEO_TYPES.includes(file.type);
      if (!isPhoto && !isVideo) {
        setFormError(`${file.name}: format harus JPG, PNG, WebP, MP4, WebM, atau MOV.`);
        continue;
      }
      if ((isPhoto && file.size > MAX_PHOTO_SIZE) || (isVideo && file.size > MAX_VIDEO_SIZE)) {
        setFormError(`${file.name}: ukuran maksimal ${isPhoto ? "5 MB per foto" : "50 MB per video"}.`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const form = new FormData();
        form.append("file", file);
        const media = await apiFetch<ReportMediaView>(`/api/surveyor/orders/${id}/media`, {
          method: "POST",
          body: form,
        });
        const next = itemsRef.current.map((it, i) => (i === index ? { ...it, media: [...it.media, media] } : it));
        setItems(next);
        itemsRef.current = next;
        // Simpan draf agar file yang sudah terunggah tidak hilang saat halaman ditutup.
        await saveDraft(next, true);
      } catch (err) {
        setFormError(errorMessage(err));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function removeMedia(media: ReportMediaView) {
    const index = active;
    const next = itemsRef.current.map((it, i) =>
      i === index ? { ...it, media: it.media.filter((m) => m.publicId !== media.publicId) } : it,
    );
    setItems(next);
    itemsRef.current = next;
    try {
      await apiFetch(`/api/surveyor/orders/${id}/media`, {
        method: "DELETE",
        body: JSON.stringify({ publicId: media.publicId, type: media.type }),
      });
    } catch {
      // File di Cloudinary bisa dibersihkan belakangan; laporan tetap tanpa file ini.
    }
    await saveDraft(next, true);
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    if (editable && event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files);
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");
    try {
      await apiFetch(`/api/surveyor/orders/${id}/report/submit`, {
        method: "POST",
        body: JSON.stringify({ items: itemsRef.current }),
      });
      setConfirmSubmit(false);
      setNotice("Laporan terkirim ke customer.");
      await reload();
    } catch (err) {
      setFormError(errorMessage(err));
      setConfirmSubmit(false);
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { title: "Order diambil", note: "Survei menjadi tanggung jawabmu", done: true },
    {
      title: "Kunjungan berlangsung",
      note: `Periksa kondisi ${order.kosCount} kos`,
      done: order.status !== "ASSIGNED",
    },
    {
      title: "Kirim laporan",
      note: "Lengkapi checklist, foto, dan temuan",
      done: order.status === "REPORT_SUBMITTED" || order.status === "COMPLETED",
    },
    { title: "Review customer", note: "Dana dilepas setelah laporan diterima", done: order.status === "COMPLETED" },
  ];

  return (
    <>
      <BackToOrders />

      <section className="page-head">
        <div>
          <p className="eyebrow">Kelola survei · #{order.code}</p>
          <h1>Survei kos di {regionLabel(order.district) || order.location}</h1>
          <p className="sub">
            Dokumentasikan kondisi sebenarnya agar {customerFirst} dapat memilih dengan yakin.
          </p>
        </div>
        <div className="sv-pills">
          <StatusPill tone={order.statusTone}>{order.statusLabel}</StatusPill>
          <StatusPill tone="success">Sudah dibayar</StatusPill>
        </div>
      </section>

      <section className="card sv-header-card">
        <div className="sv-person">
          <span className="avatar">{initials(order.customer.name)}</span>
          <div>
            <strong>{order.customer.name}</strong>
            <small>
              Customer · {order.kosCount} kos {order.isUserChoice ? "pilihan pengguna" : "rekomendasi surveyor"}
              {order.customerPhone ? ` · ${order.customerPhone}` : ""}
            </small>
          </div>
          <Link className="btn btn-secondary btn-sm" href={`/surveyor/messages/${order.id}`}>
            <Icon name="chat" size={15} /> Pesan
          </Link>
        </div>
        <div className="sv-when">
          <Icon name="calendar" size={20} />
          <div>
            <strong>
              {formatDate(order.surveyDate)} · {slotText(order.surveyTimeSlot)}
            </strong>
            <small>
              {regionLabel(order.surveyLocation?.district)}, {shortCity(order.surveyLocation?.city)} ·{" "}
              {regionLabel(order.surveyLocation?.province)}
            </small>
          </div>
        </div>
        <div className="sv-who">
          <span className="label-sm">Surveyor</span>
          <strong>{user?.fullname ?? "-"}</strong>
        </div>
      </section>

      {!editable && (
        <div className="alert alert-success sv-banner">
          <Icon name="checkCircle" size={18} />
          <div>
            <strong>
              {order.status === "COMPLETED" ? "Laporan diterima customer" : "Laporan sudah dikirim"}
            </strong>
            {order.report.submittedAt
              ? `Dikirim ${formatDateTime(order.report.submittedAt)}. `
              : ""}
            {order.status === "COMPLETED"
              ? "Pendapatan order ini sudah masuk saldo yang dapat ditarik."
              : "Menunggu customer meninjau laporan. Laporan tidak dapat diubah lagi."}
          </div>
        </div>
      )}

      <div className="two-col sv-manage">
        <div className="stack">
          <section className="card">
            <h2 className="card-title">Progres per kos</h2>
            <p className="card-sub">
              {totalChecked} dari {items.length * TOTAL_CHECKS} pemeriksaan selesai
              {editable && incompleteIndex !== -1 ? " · lanjutkan pengecekan kos berikutnya." : "."}
            </p>
            <div className="sv-kos-grid">
              {items.map((it, i) => {
                const pct = Math.round((it.checkedItems.length / TOTAL_CHECKS) * 100);
                const done = missing[i].length === 0;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`sv-kos ${i === active ? "active" : ""}`}
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                  >
                    <span className="sv-kos-top">
                      <strong>{it.kostName || `Kos ${i + 1}`}</strong>
                      <Icon name={done ? "checkCircle" : "clock"} size={17} />
                    </span>
                    <small>{it.address || "Alamat belum diisi"}</small>
                    <span className="sv-kos-meta">
                      <span>
                        {it.checkedItems.length}/{TOTAL_CHECKS} pemeriksaan selesai
                      </span>
                      <span className="link">{i === active ? "Sedang dibuka" : "Lanjutkan →"}</span>
                    </span>
                    <span className="sv-bar">
                      <span style={{ width: `${pct}%` }} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {item && (
            <>
              <section className="card">
                <h2 className="card-title">Checklist {item.kostName || `Kos ${active + 1}`}</h2>
                <p className="card-sub">Tandai setiap aspek setelah diperiksa langsung di lokasi.</p>
                <div className="sv-checklist">
                  {CHECKLIST_GROUPS.map((group) => (
                    <div key={group.title}>
                      <p className="sv-group">
                        <Icon name={group.icon} size={16} /> {group.title}
                      </p>
                      {group.items.map((label) => (
                        <label key={label} className="check">
                          <input
                            type="checkbox"
                            checked={item.checkedItems.includes(label)}
                            disabled={!editable}
                            onChange={() => toggleCheck(label)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="sv-check-foot">
                  <StatusPill tone={item.checkedItems.length === TOTAL_CHECKS ? "success" : "muted"}>
                    {item.checkedItems.length}/{TOTAL_CHECKS} diperiksa
                  </StatusPill>
                  {savedAt && <span className="muted">Terakhir diperbarui {formatTime(savedAt)} WIB</span>}
                </div>
              </section>

              <section className="card">
                <h2 className="card-title">Bukti foto {item.kostName || `Kos ${active + 1}`}</h2>
                <p className="card-sub">
                  Unggah foto asli yang jelas: kamar, kamar mandi, fasilitas, dan lingkungan. Video singkat juga boleh.
                </p>
                <div className="sv-media">
                  {item.media.map((m) => (
                    <figure key={m.publicId} className="sv-thumb">
                      {m.type === "video" ? (
                        <video src={m.url} controls preload="metadata" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.name || "Bukti foto"} />
                      )}
                      <figcaption>
                        <strong>{m.name || (m.type === "video" ? "Video" : "Foto")}</strong>
                        <small>{fileSize(m.size)} · Berhasil diunggah ✓</small>
                        {editable && (
                          <button type="button" className="sv-remove" onClick={() => removeMedia(m)} aria-label="Hapus file">
                            <Icon name="trash" size={14} />
                          </button>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                  {editable && (
                    <button
                      type="button"
                      className={`upload-box sv-drop ${dragging ? "dragging" : ""}`}
                      onClick={() => fileInput.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      disabled={uploading > 0}
                    >
                      {uploading > 0 ? <span className="spinner" /> : <Icon name="upload" size={22} />}
                      <strong>{uploading > 0 ? `Mengunggah ${uploading} file…` : "Tambahkan bukti foto"}</strong>
                      <span>Klik atau seret foto ke sini</span>
                      <span>JPG / PNG · Maks. 5 MB per foto · Video MP4 maks. 50 MB</span>
                    </button>
                  )}
                  <input
                    ref={fileInput}
                    type="file"
                    hidden
                    multiple
                    accept={[...PHOTO_TYPES, ...VIDEO_TYPES].join(",")}
                    onChange={(e) => {
                      if (e.target.files?.length) void uploadFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="hint" style={{ marginTop: 14 }}>
                  {item.media.length === 0
                    ? "Belum ada foto. Minimal 1 foto per kos sebelum laporan dikirim."
                    : `${item.media.length} file tersimpan.`}
                </p>
              </section>

              <section className="card">
                <h2 className="card-title">Isi laporan {item.kostName || `Kos ${active + 1}`}</h2>
                <p className="card-sub">Jelaskan temuanmu secara objektif, termasuk hal yang perlu dipertimbangkan.</p>

                {order.isUserChoice && target && (
                  <div className="sv-target-info">
                    <Icon name="pin" size={16} />
                    <div>
                      <strong>Data kos dari customer</strong>
                      <span>{target.address || "Alamat tidak dicantumkan"}</span>
                      <span>
                        {target.ownerContact ? `Kontak pemilik: ${target.ownerContact}` : "Kontak pemilik tidak dicantumkan"}
                        {target.link && (
                          <>
                            {" · "}
                            <a href={target.link} target="_blank" rel="noreferrer">
                              Buka peta ↗
                            </a>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="field">
                    <label className="label" htmlFor="kos-name">
                      Nama kos
                    </label>
                    <input
                      id="kos-name"
                      className="input"
                      value={item.kostName}
                      disabled={!editable}
                      placeholder="Mis. Kos Melati"
                      onChange={(e) => update({ kostName: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="kos-address">
                      Alamat kos
                    </label>
                    <input
                      id="kos-address"
                      className="input"
                      value={item.address}
                      disabled={!editable}
                      placeholder="Jl. Kaliurang Km 5, Sinduadi"
                      onChange={(e) => update({ address: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="kos-price">
                      Harga sewa terkonfirmasi
                    </label>
                    <div className="sv-money">
                      <span>Rp</span>
                      <input
                        id="kos-price"
                        className="input"
                        inputMode="numeric"
                        value={rupiahInput(item.price)}
                        disabled={!editable}
                        placeholder="1.250.000"
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                          update({ price: digits ? Number(digits) : null });
                        }}
                      />
                      <span>/ bulan</span>
                    </div>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="kos-availability">
                      Ketersediaan
                    </label>
                    <select
                      id="kos-availability"
                      className="select"
                      value={item.availability}
                      disabled={!editable}
                      onChange={(e) => update({ availability: e.target.value })}
                    >
                      <option value="">Pilih ketersediaan</option>
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field span-2">
                    <label className="label" htmlFor="kos-condition">
                      Kondisi, fasilitas &amp; lingkungan
                    </label>
                    <textarea
                      id="kos-condition"
                      className="textarea"
                      rows={4}
                      value={item.condition}
                      disabled={!editable}
                      placeholder="Kamar bersih, dinding tidak lembap, ventilasi baik. Air mengalir lancar…"
                      onChange={(e) => update({ condition: e.target.value })}
                    />
                  </div>
                  <div className="field span-2">
                    <label className="label" htmlFor="kos-notes">
                      Catatan untuk {customerFirst}
                    </label>
                    <textarea
                      id="kos-notes"
                      className="textarea"
                      rows={3}
                      value={item.notes}
                      disabled={!editable}
                      placeholder="Saran atau hal yang perlu dikonfirmasi sebelum memesan."
                      onChange={(e) => update({ notes: e.target.value })}
                    />
                  </div>
                </div>
                {savedAt && (
                  <p className="hint sv-saved">
                    <Icon name="refresh" size={13} /> Draf terakhir disimpan {formatDateTime(savedAt)}
                    {dirty ? " · ada perubahan belum disimpan" : ""}
                  </p>
                )}
              </section>
            </>
          )}

          {formError && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert" size={17} />
              <span>{formError}</span>
            </div>
          )}

          {editable && (
            <section className="card sv-actionbar">
              <div>
                <strong>{ready ? "Laporan siap dikirim" : "Laporan masih berupa draf"}</strong>
                <small>
                  {ready
                    ? "Periksa kembali sebelum mengirim. Laporan tidak dapat diubah setelah dikirim."
                    : `Lengkapi ${(missing[incompleteIndex] ?? ["laporan"]).join(", ")} ${
                        items[incompleteIndex]?.kostName || `Kos ${incompleteIndex + 1}`
                      } sebelum mengirim.`}
                </small>
              </div>
              <div className="sv-actions">
                <button type="button" className="btn btn-secondary" onClick={() => saveDraft()} disabled={saving}>
                  {saving ? <span className="spinner" /> : <Icon name="save" size={16} />} Simpan draf
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!ready || saving || uploading > 0}
                  onClick={() => setConfirmSubmit(true)}
                >
                  <Icon name="send" size={16} /> Kirim laporan
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="stack">
          <section className="card">
            <h2 className="card-title">Kebutuhan {customerFirst}</h2>
            <div className="tag-row" style={{ margin: "14px 0 6px" }}>
              <span className="chip">{genderLabel(order.requirements.genderPreferences)}</span>
              {order.requirements.landmark && <span className="chip">Dekat {order.requirements.landmark}</span>}
            </div>
            <div className="sv-kv">
              <div>
                <span>Anggaran / bulan</span>
                <strong>{budgetShort(order.requirements.budget).replace("/bulan", "")}</strong>
              </div>
              <div>
                <span>Rencana pindah</span>
                <strong>{order.moveInDate ? formatDate(order.moveInDate, "long") : "-"}</strong>
              </div>
            </div>
            {order.requirements.facilities.length > 0 && (
              <p className="muted sv-par">Fasilitas: {order.requirements.facilities.join(", ")}</p>
            )}
            {order.requirements.notes && <p className="muted sv-par">{order.requirements.notes}</p>}
            <Link className="btn btn-secondary btn-block" href={`/surveyor/messages/${order.id}`}>
              <Icon name="chat" size={15} /> Lihat percakapan
            </Link>
          </section>

          <section className="card">
            <h2 className="card-title">Ringkasan pendapatan</h2>
            <div className="sv-kv">
              <div>
                <span>Jumlah kos</span>
                <strong>{order.kosCount} kos</strong>
              </div>
              <div>
                <span>Pendapatan per kos</span>
                <strong>{formatRupiah(PRICE_PER_KOS)}</strong>
              </div>
            </div>
            <div className="sv-earn" style={{ marginTop: 6 }}>
              <div className="total">
                <span>Pendapatan bersih</span>
                <strong>{formatRupiah(order.earning)}</strong>
              </div>
            </div>
            <p className="hint">
              {order.status === "COMPLETED"
                ? "Laporan diterima. Pendapatan sudah masuk saldo dapat ditarik."
                : "Pendapatan tersedia setelah laporan lengkap diterima. Order ini belum masuk saldo dapat ditarik."}
            </p>
            <div style={{ marginTop: 12 }}>
              <StatusPill tone="success">Pembayaran customer terkonfirmasi</StatusPill>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Alur penyelesaian</h2>
            <ol className="sv-flow">
              {steps.map((s) => (
                <li key={s.title} className={s.done ? "done" : ""}>
                  <Icon name={s.done ? "checkCircle" : "clock"} size={17} />
                  <div>
                    <strong>{s.title}</strong>
                    <small>{s.note}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="alert alert-success">
            <Icon name="headset" size={18} />
            <div>
              <strong>Butuh bantuan di lokasi?</strong>
              Hubungi tim CKIN jika kos tidak dapat diakses atau ada perubahan jadwal.
            </div>
          </div>
        </aside>
      </div>

      {confirmSubmit && (
        <ConfirmModal
          title="Kirim laporan ke customer?"
          description={`Laporan ${items.length} kos untuk #${order.code} akan dikirim ke ${order.customer.name}. Setelah dikirim, laporan tidak dapat diubah.`}
          confirmLabel="Kirim laporan"
          cancelLabel="Periksa lagi"
          loading={submitting}
          onConfirm={submit}
          onClose={() => setConfirmSubmit(false)}
        />
      )}

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}

function BackToOrders() {
  return (
    <Link href="/surveyor/orders" className="sv-back">
      <Icon name="arrowLeft" size={15} /> Kembali ke order survei
    </Link>
  );
}
