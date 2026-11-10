"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Icon from "@/src/components/ui/Icon";
import { apiFetch, ClientApiError, errorMessage } from "@/src/lib/client-api";
import { ASSISTANT_DAILY_LIMIT, ASSISTANT_MAX_LENGTH, ASSISTANT_SESSION_MESSAGES } from "@/src/lib/assistant/limits";

type Msg = {
  role: "user" | "assistant";
  content: string;
  links?: Array<{ title: string; href: string }>;
  kind?: "limit" | "error";
};

const SUGGESTIONS = {
  customer: ["Status pesanan terakhir saya?", "Berapa saldo saya?", "Bagaimana kalau saya batalkan pesanan?", "Cara top up saldo"],
  surveyor: ["Order saya yang berjalan?", "Apa itu dana tertahan?", "Berapa saldo yang bisa ditarik?", "Aturan ambil order"],
} as const;

/** Tampilkan **tebal** dan baris baru dari jawaban asisten tanpa HTML mentah. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Chatbot customer service (RAG) — menggantikan tombol "Hubungi bantuan".
 * Menjawab pertanyaan tentang pesanan/saldo/penghasilan milik pengguna sendiri.
 * Batasan: 300 karakter per pertanyaan, 6 per menit, 30 per hari, 20 pesan per percakapan.
 */
export default function AssistantWidget({
  role,
  open,
  onOpenChange,
  userName,
  hideFab = false,
}: {
  role: "customer" | "surveyor";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  /** Sembunyikan tombol melayang (mis. di halaman chat agar tidak menutupi tombol kirim). */
  hideFab?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sessionFull = messages.filter((m) => m.role === "user").length >= ASSISTANT_SESSION_MESSAGES / 2;
  const dailyOut = remaining === 0;
  const locked = sessionFull || dailyOut;
  const tooLong = input.length > ASSISTANT_MAX_LENGTH;

  const loadQuota = useCallback(async () => {
    try {
      const res = await apiFetch<{ remaining: number }>("/api/assistant");
      setRemaining(res.remaining);
    } catch {
      /* kuota hanya informasi tambahan */
    }
  }, []);

  useEffect(() => {
    if (open && remaining === null) void loadQuota();
  }, [open, remaining, loadQuota]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy || locked) return;
    if (q.length > ASSISTANT_MAX_LENGTH) return;
    const history = messages.filter((m) => !m.kind).map(({ role: r, content }) => ({ role: r, content }));
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await apiFetch<{ answer: string; links: Msg["links"]; remaining: number }>("/api/assistant", {
        method: "POST",
        body: JSON.stringify({ question: q, history }),
      });
      setRemaining(res.remaining);
      setMessages((m) => [...m, { role: "assistant", content: res.answer, links: res.links }]);
    } catch (err) {
      const limit = err instanceof ClientApiError && err.status === 429;
      if (limit && /hari ini|today/i.test(err.message)) setRemaining(0);
      setMessages((m) => [...m, { role: "assistant", content: errorMessage(err), kind: limit ? "limit" : "error" }]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  function reset() {
    setMessages([]);
    setInput("");
  }

  return (
    <>
      {!open && !hideFab && (
        <button type="button" className="assistant-fab" onClick={() => onOpenChange(true)} aria-label="Buka asisten CKIN">
          <Icon name="bot" size={22} />
        </button>
      )}
      {open && (
        <section className="assistant" role="dialog" aria-label="Asisten CKIN">
          <header className="assistant-head">
            <span className="assistant-avatar">
              <Icon name="sparkle" size={18} />
            </span>
            <div className="grow">
              <strong>Asisten CKIN</strong>
              <small>Customer service · tanya soal pesananmu</small>
            </div>
            {messages.length > 0 && (
              <button type="button" className="icon-btn" onClick={reset} aria-label="Percakapan baru" title="Percakapan baru">
                <Icon name="refresh" size={17} />
              </button>
            )}
            <button type="button" className="icon-btn" onClick={() => onOpenChange(false)} aria-label="Tutup asisten">
              <Icon name="x" size={18} />
            </button>
          </header>

          <div className="assistant-body" ref={listRef}>
            <div className="assistant-msg bot">
              <p>
                Halo{userName ? `, ${userName.split(" ")[0]}` : ""}! Saya bisa menjawab pertanyaan tentang{" "}
                {role === "customer" ? "pesanan, pembayaran, saldo, dan laporan survei" : "order, laporan, dan penghasilan"}
                -mu. Data yang saya baca hanya milik akunmu.
              </p>
            </div>
            {messages.length === 0 && (
              <div className="assistant-suggest">
                {SUGGESTIONS[role].map((s) => (
                  // Kirim teks yang tampil (ikut bahasa yang dipilih).
                  <button key={s} type="button" disabled={locked} onClick={(e) => ask(e.currentTarget.textContent || s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`assistant-msg ${m.role === "user" ? "me" : "bot"} ${m.kind ?? ""}`}>
                <p data-no-translate>
                  {m.kind === "limit" && <Icon name="alert" size={14} />} <RichText text={m.content} />
                </p>
                {m.links && m.links.length > 0 && (
                  <div className="assistant-src">
                    {m.links.map((l) => (
                      <Link key={l.href} href={l.href} onClick={() => onOpenChange(false)} data-no-translate>
                        {l.title} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="assistant-msg bot">
                <p className="typing">
                  <span />
                  <span />
                  <span />
                </p>
              </div>
            )}
            {sessionFull && (
              <div className="assistant-limit" role="status">
                <strong>Percakapan sudah mencapai batas {ASSISTANT_SESSION_MESSAGES} pesan.</strong>
                <span>Mulai percakapan baru agar jawaban tetap fokus.</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>
                  <Icon name="refresh" size={14} /> Percakapan baru
                </button>
              </div>
            )}
            {dailyOut && !sessionFull && (
              <div className="assistant-limit" role="status">
                <strong>Batas {ASSISTANT_DAILY_LIMIT} pertanyaan hari ini sudah tercapai.</strong>
                <span>Kuota kembali besok. Untuk hal mendesak, email bantuan@ckin.id.</span>
              </div>
            )}
          </div>

          <form className="assistant-input" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, ASSISTANT_MAX_LENGTH + 50))}
              placeholder={locked ? "Batas pertanyaan tercapai" : "Tulis pertanyaan, mis. status SGH-261102"}
              aria-label="Pertanyaan"
              disabled={locked}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={busy || locked || tooLong || input.trim().length < 2}
              aria-label="Kirim"
            >
              <Icon name="send" size={16} />
            </button>
          </form>
          <div className="assistant-foot">
            <span className={tooLong ? "over" : ""}>
              {tooLong ? `Terlalu panjang · ` : ""}
              {input.length}/{ASSISTANT_MAX_LENGTH}
            </span>
            <span>
              {remaining !== null ? `Sisa ${remaining}/${ASSISTANT_DAILY_LIMIT} pertanyaan hari ini` : "Hanya topik seputar CKIN"}
            </span>
          </div>
        </section>
      )}
    </>
  );
}
