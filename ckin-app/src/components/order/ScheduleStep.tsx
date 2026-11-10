"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { formatDate } from "@/src/lib/format";
import {
  addDays,
  maxSurveyDateFor,
  minMoveInDate,
  minSurveyDate,
} from "@/src/lib/pricing";
import { saveDraft, useDraft } from "./draft";
import { BackLink, OrderPage, OrderSummaryCard, useRequireDraft } from "./OrderFlow";

const DOW = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function longDate(ymd: string) {
  return new Date(`${ymd}T12:00:00+07:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);
}

/** Langkah 3 — rencana masuk kos, tanggal & jam survei (kalender sesuai Figma). */
export default function ScheduleStep() {
  const router = useRouter();
  const draft = useDraft();
  useRequireDraft(draft, ["surveyLocation", "kosCount", "serviceType"]);
  const [minMove, setMinMove] = useState("");
  const [minSurvey, setMinSurvey] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [surveyDate, setSurveyDate] = useState("");
  const [month, setMonth] = useState({ y: 0, m: 0 });
  const [error, setError] = useState("");

  // Hitung tanggal di client (tergantung "hari ini").
  useEffect(() => {
    const mm = minMoveInDate();
    const ms = minSurveyDate();
    setMinMove(mm);
    setMinSurvey(ms);
    const d = draft;
    const move = d?.moveInDate && d.moveInDate >= mm ? d.moveInDate : addDays(mm, 7);
    setMoveIn(move);
    const survey = d?.surveyDate && d.surveyDate >= ms && d.surveyDate <= maxSurveyDateFor(move) ? d.surveyDate : "";
    setSurveyDate(survey);
    const focus = survey || ms;
    setMonth({ y: Number(focus.slice(0, 4)), m: Number(focus.slice(5, 7)) - 1 });
  }, [draft]);

  const maxSurvey = moveIn ? maxSurveyDateFor(moveIn) : "";

  const cells = useMemo(() => {
    if (!month.y) return [];
    const first = new Date(Date.UTC(month.y, month.m, 1));
    const lead = (first.getUTCDay() + 6) % 7; // Senin = 0
    const days = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
    const list: Array<string | null> = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d += 1) {
      list.push(`${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return list;
  }, [month]);

  function shiftMonth(delta: number) {
    setMonth(({ y, m }) => {
      const next = new Date(Date.UTC(y, m + delta, 1));
      return { y: next.getUTCFullYear(), m: next.getUTCMonth() };
    });
  }

  function changeMoveIn(value: string) {
    setMoveIn(value);
    setError("");
    if (surveyDate && surveyDate > maxSurveyDateFor(value)) setSurveyDate("");
  }

  function next() {
    if (!moveIn || moveIn < minMove) return setError(`Tanggal masuk minimal ${formatDate(minMove, "long")}.`);
    if (!surveyDate) return setError("Pilih tanggal survei pada kalender.");
    if (surveyDate < minSurvey || surveyDate > maxSurvey) {
      return setError("Tanggal survei harus di antara H+2 dan 7 hari sebelum tanggal masuk.");
    }
    saveDraft({ moveInDate: moveIn, surveyDate, surveyTimeSlot: undefined });
    router.push("/customer/orders/new/konfirmasi");
  }

  const backHref =
    draft?.serviceType === "USER_CHOICE" ? "/customer/orders/new/kos-pilihan" : "/customer/orders/new/preferensi";

  return (
    <OrderPage
      eyebrow="Jadwal survei"
      title="Pilih tanggal yang pas."
      subtitle="Jadwalkan survei minimal 7 hari sebelum tanggal rencana masuk kos."
      step={2}
    >
      <div className="two-col">
        <div className="stack">
          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 18 }}>
              Kapan rencana masuk kos?
            </h2>
            <div className="field">
              <label className="label" htmlFor="move-in">
                Tanggal rencana masuk
              </label>
              <div className="input-wrap">
                <Icon name="calendar" size={17} />
                <input
                  id="move-in"
                  type="date"
                  className="input"
                  min={minMove}
                  value={moveIn}
                  onChange={(e) => changeMoveIn(e.target.value)}
                />
              </div>
            </div>
            {maxSurvey && (
              <div className="alert alert-info" style={{ marginTop: 16 }}>
                <Icon name="info" size={18} />
                <div>
                  <strong style={{ fontWeight: 600 }}>Batas tanggal survei: {formatDate(maxSurvey, "long")}</strong>
                  Kami memberi jeda setidaknya 7 hari agar kamu punya waktu membaca laporan dan memutuskan kos.
                </div>
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">Tanggal survei</h2>
            <p className="card-sub">Pilih tanggal yang tersedia. Jam kunjungan menyesuaikan surveyor.</p>

            <div className="calendar-head">
              <strong style={{ fontWeight: 500 }}>
                {month.y ? `${MONTHS[month.m]} ${month.y}` : ""}
              </strong>
              <span style={{ display: "flex", gap: 4 }}>
                <button type="button" className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya">
                  <Icon name="chevronRight" size={18} style={{ transform: "rotate(180deg)" }} />
                </button>
                <button type="button" className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya">
                  <Icon name="chevronRight" size={18} />
                </button>
              </span>
            </div>

            <div className="calendar" role="grid" aria-label="Kalender survei">
              {DOW.map((d) => (
                <span key={d} className="dow">
                  {d}
                </span>
              ))}
              {cells.map((ymd, index) => {
                if (!ymd) return <span key={`e-${index}`} />;
                const available = ymd >= minSurvey && ymd <= maxSurvey;
                return (
                  <button
                    key={ymd}
                    type="button"
                    disabled={!available}
                    className={`${available ? "available" : ""} ${surveyDate === ymd ? "selected" : ""}`}
                    onClick={() => {
                      setSurveyDate(ymd);
                      setError("");
                    }}
                    aria-pressed={surveyDate === ymd}
                    aria-label={longDate(ymd)}
                  >
                    {Number(ymd.slice(8))}
                  </button>
                );
              })}
            </div>
            <div className="cal-legend">
              <span>Tersedia</span>
              <span>Tidak tersedia / di luar batas</span>
            </div>

            {surveyDate && (
              <div className="pick-box">
                {longDate(surveyDate)}
                <small>Jam kunjungan diatur bersama surveyor lewat chat setelah order diambil.</small>
              </div>
            )}
          </section>

          {error && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert" size={17} />
              <span>{error}</span>
            </div>
          )}
          <div>
            <BackLink href={backHref}>
              {draft?.serviceType === "USER_CHOICE" ? "Kembali ke daftar kos" : "Kembali ke preferensi"}
            </BackLink>
          </div>
        </div>

        <aside className="stack">
          <OrderSummaryCard
            draft={draft}
            extra={
              surveyDate ? (
                <div className="pick-box" style={{ margin: "0 0 18px" }}>
                  {formatDate(surveyDate, "long")}
                  <small>{draft?.kosCount} kos · jam diatur via chat</small>
                  <small style={{ color: "var(--accent)" }}>
                    ✓ {daysBetween(surveyDate, moveIn)} hari sebelum rencana masuk
                  </small>
                </div>
              ) : null
            }
            action={
              <button type="button" className="btn btn-primary btn-block" onClick={next}>
                <Icon name="arrowRight" size={16} /> Tinjau pesanan
              </button>
            }
          />
          <div className="alert alert-info">
            <Icon name="info" size={18} />
            <div>
              <strong style={{ fontWeight: 500 }}>Pastikan kamu bisa dihubungi.</strong>
              Surveyor mungkin menghubungimu saat kunjungan untuk mengonfirmasi detail kos.
            </div>
          </div>
        </aside>
      </div>
    </OrderPage>
  );
}
