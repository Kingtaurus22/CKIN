"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Icon from "@/src/components/ui/Icon";
import MediaCarousel, { type CarouselMedia } from "@/src/components/ui/MediaCarousel";
import { ErrorState, PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { apiFetch, ClientApiError, errorMessage } from "@/src/lib/client-api";
import { firstName, formatDate, formatDateTime, formatRupiah, initials, regionLabel } from "@/src/lib/format";
import type { SurveyReportView } from "@/src/types/customer";

type Item = SurveyReportView["items"][number];

function Gallery({ item }: { item: Item }) {
  const media: CarouselMedia[] = [
    ...item.photos.map((url) => ({ type: "image" as const, url })),
    ...item.videos.map((url) => ({ type: "video" as const, url })),
  ];
  return (
    <>
      <MediaCarousel media={media} title={item.kostName} />
      <p className="muted" style={{ fontSize: 12, margin: "10px 0 0" }}>
        {item.photos.length} foto asli · {item.videos.length} video · klik media untuk memperbesar
      </p>
    </>
  );
}

function ReviewCard({
  report,
  onSubmitted,
}: {
  report: SurveyReportView;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const surveyorName = report.surveyor?.name ?? "surveyor";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (comment.trim().length < 10) {
      setError("Ulasan minimal 10 karakter.");
      return;
    }
    setSending(true);
    try {
      await apiFetch(`/api/customer/orders/${report.orderId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      onSubmitted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card" id="ulasan">
      <h2 className="card-title">Ulasanmu untuk {firstName(surveyorName)}</h2>
      {report.surveyor && (
        <div className="surveyor-row" style={{ marginTop: 18 }}>
          <span className="avatar">{initials(report.surveyor.name)}</span>
          <div>
            <strong>{report.surveyor.name}</strong>
            <small style={{ color: "var(--muted)" }}>
              Surveyor · {regionLabel(report.surveyor.district)}
            </small>
          </div>
        </div>
      )}

      {report.review ? (
        <>
          <div className="stars readonly" aria-label={`${report.review.rating} dari 5 bintang`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>{i < report.review!.rating ? "★" : "☆"}</span>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.65 }}>
            “{report.review.comment}”
          </p>
          <p className="text-link" style={{ marginTop: 16, fontWeight: 500 }}>
            <Icon name="checkCircle" size={15} /> Ulasan terkirim · {formatDate(report.review.createdAt)}
          </p>
        </>
      ) : (
        <form onSubmit={submit}>
          <div className="stars" role="radiogroup" aria-label="Pilih rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= rating ? "on" : ""}
                onClick={() => setRating(n)}
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} bintang`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="textarea"
            placeholder="Ceritakan pengalamanmu: kelengkapan laporan, ketepatan waktu, komunikasi…"
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            aria-label="Tulis ulasan"
          />
          {error && <p className="field-error" style={{ marginTop: 8 }}>{error}</p>}
          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={sending}>
            {sending ? <span className="spinner" /> : <Icon name="star" size={16} />} Kirim ulasan
          </button>
          <p className="center-note">Pesanan dinyatakan selesai setelah ulasan dikirim.</p>
        </form>
      )}
    </section>
  );
}

export default function CustomerReport({ id }: { id: string }) {
  const [report, setReport] = useState<SurveyReportView | null>(null);
  const [orderCode, setOrderCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiFetch<{ report: SurveyReportView | null; orderCode: string }>(
        `/api/customer/orders/${id}/report`,
      );
      setReport(data.report);
      setOrderCode(data.orderCode);
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

  // Kos dengan skor tertinggi diberi label "Paling sesuai".
  const bestIndex = useMemo(() => {
    if (!report) return -1;
    let best = -1;
    let bestScore = -1;
    report.items.forEach((item, index) => {
      if (item.score !== null && item.score > bestScore) {
        bestScore = item.score;
        best = index;
      }
    });
    return best;
  }, [report]);

  if (notFound) {
    return (
      <div className="card empty">
        <strong>Pesanan tidak ditemukan</strong>
        <Link className="btn btn-primary btn-sm" href="/customer/orders">
          Kembali ke pesanan saya
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stack">
        <Skeleton height={34} width="50%" />
        <Skeleton height={70} />
        <Skeleton height={320} />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  if (!report) {
    return (
      <>
        <PageHeader eyebrow="Laporan survei" title="Laporan belum tersedia" subtitle={`Pesanan #${orderCode}`} />
        <div className="card empty">
          <strong>Surveyor belum mengirim laporan akhir</strong>
          <p>Setelah laporan diterima, foto, video, temuan, dan formulir ulasan akan muncul di sini.</p>
          <Link className="btn btn-secondary btn-sm" href={`/customer/orders/${id}`}>
            Lihat progres pesanan
          </Link>
        </div>
      </>
    );
  }

  const item = report.items[activeIndex];
  const surveyorFirst = firstName(report.surveyor?.name) || "surveyor";
  const best = bestIndex >= 0 ? report.items[bestIndex] : null;

  return (
    <>
      <PageHeader
        eyebrow="Laporan survei"
        title="Sudah dicek. Sekarang, giliranmu memilih."
        subtitle={`Pesanan #${report.orderCode} · Survei ${formatDate(report.surveyDate, "long")}${
          report.surveyor ? ` · ${report.surveyor.name}` : ""
        }`}
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Icon name="download" size={16} /> Unduh laporan PDF
          </button>
        }
      />

      <section className="status-banner">
        <span className="check-circle">
          <Icon name="check" size={20} />
        </span>
        <div>
          <strong>
            {report.items.length} kos selesai disurvei. Semua laporan sudah kamu terima.
          </strong>
          <small>
            Diterima {formatDateTime(report.submittedAt)}
            {report.status !== "COMPLETED" && " · Pesanan selesai setelah ulasan dikirim."}
          </small>
        </div>
        <div className="flags">
          <span>{report.payment}</span>
          <span>Laporan diterima</span>
          {report.status === "COMPLETED" && <span>Selesai</span>}
        </div>
      </section>

      <div className="two-col">
        <div className="stack">
          {report.items.length > 1 && (
            <div className="kos-tabs" role="tablist" aria-label="Pilih kos">
              {report.items.map((kos, index) => (
                <button
                  key={`${kos.kostName}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  className={`kos-tab ${index === activeIndex ? "active" : ""}`}
                  onClick={() => setActiveIndex(index)}
                >
                  {kos.kostName} <Icon name="checkCircle" size={15} />
                </button>
              ))}
            </div>
          )}

          {item ? (
            <section className="card">
              <div className="card-head" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="card-title" style={{ fontSize: 22 }}>
                    {item.kostName}
                  </h2>
                  <p className="card-sub">{item.address}</p>
                </div>
                {activeIndex === bestIndex && <StatusPill tone="success">Paling sesuai</StatusPill>}
              </div>

              <Gallery key={activeIndex} item={item} />

              <div className="facts">
                <div>
                  <span>Harga sewa / bulan</span>
                  <strong className="big">{item.price !== null ? formatRupiah(item.price) : "-"}</strong>
                </div>
                <div>
                  <span>Ukuran &amp; tipe</span>
                  <strong>{[item.size, item.genderPreference].filter(Boolean).join(" · ") || "-"}</strong>
                </div>
                <div>
                  <span>Ketersediaan</span>
                  <strong className="ok">{item.availability ?? "-"}</strong>
                </div>
              </div>

              <h3 className="card-title" style={{ fontSize: 16 }}>
                Temuan surveyor
              </h3>
              {item.condition && (
                <p style={{ margin: "12px 0", lineHeight: 1.6, whiteSpace: "pre-line" }}>{item.condition}</p>
              )}
              {(item.checkedItems ?? []).length > 0 && (
                <ul className="findings">
                  {(item.checkedItems ?? []).map((text) => (
                    <li key={`k-${text}`} className="pro">
                      <Icon name="check" size={14} /> {text} — sudah diperiksa
                    </li>
                  ))}
                </ul>
              )}
              {item.pros.length + item.cons.length > 0 ? (
                <ul className="findings">
                  {item.pros.map((text) => (
                    <li key={`p-${text}`} className="pro">
                      <Icon name="check" size={14} /> {text}
                    </li>
                  ))}
                  {item.cons.map((text) => (
                    <li key={`c-${text}`} className="con">
                      <strong>!</strong> {text}
                    </li>
                  ))}
                </ul>
              ) : !item.condition && (item.checkedItems ?? []).length === 0 ? (
                <p className="muted" style={{ margin: "12px 0 18px" }}>
                  Tidak ada catatan temuan.
                </p>
              ) : null}
              {item.facilities.length > 0 && (
                <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
                  Fasilitas: {item.facilities.join(" · ")}
                </p>
              )}
              {item.notes && (
                <div className="note-box">
                  <strong>Catatan {surveyorFirst}</strong>“{item.notes}”
                </div>
              )}
            </section>
          ) : (
            <div className="card empty">Laporan belum berisi data kos.</div>
          )}

          {report.items.length > 1 && (
            <section className="card">
              <h2 className="card-title" style={{ marginBottom: 14 }}>
                Bandingkan hasil {report.items.length} kos
              </h2>
              <div className="table-wrap">
                <table className="compare">
                  <tbody>
                    {report.items.map((kos, index) => (
                      <tr key={`${kos.kostName}-${index}`}>
                        <td>{kos.kostName}</td>
                        <td>{kos.price !== null ? formatRupiah(kos.price) : "-"}</td>
                        <td className="muted">{kos.distanceNote ?? kos.size ?? ""}</td>
                        <td>{kos.score !== null ? `${kos.score}/10` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className="stack">
          <section className="card">
            <h2 className="card-title">Rekomendasi surveyor</h2>
            <p className="card-sub" style={{ lineHeight: 1.6 }}>
              Kos dengan penilaian tertinggi dari laporan ini. Hubungi pemilik kos secara langsung bila cocok —
              CKIN membantu sampai tahap survei.
            </p>
            {best && (
              <div className="pick-box">
                {best.kostName}
                <small>
                  {best.price !== null ? `${formatRupiah(best.price)} / bulan` : ""}
                  {best.availability ? ` · ${best.availability}` : ""}
                </small>
              </div>
            )}
            <ul className="check-list">
              <li>
                <Icon name="check" size={13} /> Pembayaran survei {report.payment === "Sudah dibayar" ? "lunas" : "—"}
              </li>
              <li>
                <Icon name="check" size={13} /> Laporan survei sudah diterima
              </li>
              <li>
                <Icon name={report.review ? "check" : "clock"} size={13} />{" "}
                {report.review ? "Ulasan sudah dikirim" : "Ulasan untuk surveyor belum dikirim"}
              </li>
            </ul>
            <a className="btn btn-primary btn-block" href="#ulasan">
              <Icon name="star" size={16} /> {report.review ? "Lihat ulasanmu" : "Beri ulasan surveyor"}
            </a>
          </section>

          <ReviewCard report={report} onSubmitted={load} />

          <section className="card">
            <h2 className="card-title">Forum pesanan</h2>
            <p className="card-sub" style={{ lineHeight: 1.6, margin: "12px 0 18px" }}>
              Ada pertanyaan tentang laporan? Tanyakan langsung ke {surveyorFirst}.
            </p>
            <Link className="btn btn-secondary btn-block" href={`/customer/messages/${report.orderId}`}>
              <Icon name="chat" size={16} /> Buka chat surveyor
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
