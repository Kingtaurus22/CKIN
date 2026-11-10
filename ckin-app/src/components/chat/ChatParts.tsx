"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Icon from "@/src/components/ui/Icon";
import { formatDate, formatTime } from "@/src/lib/format";
import type { ChatMessage } from "@/src/types/customer";

const MAX_IMAGE = 5 * 1024 * 1024;

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function dayLabel(iso: string) {
  const today = dayKey(new Date().toISOString());
  const label = formatDate(iso, "long");
  return dayKey(iso) === today ? `Hari ini, ${label}` : label;
}

export function MessageList({
  messages,
  myRole,
  typing,
  compact,
}: {
  messages: ChatMessage[];
  myRole: "customer" | "surveyor";
  typing?: boolean;
  compact?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Gulir hanya kotak chat-nya (bukan seluruh halaman), supaya membuka
    // detail pesanan tidak melompat ke bawah.
    let box = endRef.current?.parentElement ?? null;
    while (box && !(/(auto|scroll)/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight)) {
      box = box.parentElement;
    }
    if (box && box !== document.body && box !== document.documentElement) box.scrollTop = box.scrollHeight;
  }, [messages.length, typing]);

  let lastDay = "";
  return (
    <>
      {messages.map((message) => {
        const mine = message.senderRole === myRole;
        const key = dayKey(message.createdAt);
        const showDay = !compact && key !== lastDay;
        lastDay = key;
        return (
          <div key={message.id} style={{ display: "contents" }}>
            {showDay && <p className="chat-day">{dayLabel(message.createdAt)}</p>}
            <div className={`bubble ${mine ? "mine" : ""}`}>
              {message.attachment && (
                <a href={message.attachment.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={message.attachment.url} alt={message.attachment.name} />
                </a>
              )}
              {message.text && <span data-no-translate>{message.text}</span>}
              <span className="meta">
                {formatTime(message.createdAt)}
                {message.attachment && <span>· {message.attachment.name}</span>}
                {mine && (
                  <span className={message.readAt ? "read" : ""}>
                    <Icon name={message.readAt ? "checkDouble" : "check"} size={13} />{" "}
                    {message.readAt ? "Dibaca" : "Terkirim"}
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      })}
      {typing && <p className="typing">sedang mengetik…</p>}
      <div ref={endRef} />
    </>
  );
}

export function Composer({
  placeholder,
  sending,
  onSend,
  onTyping,
  compact,
  disabled,
}: {
  placeholder: string;
  sending: boolean;
  onSend: (text: string, image: File | null) => Promise<boolean>;
  onTyping?: (typing: boolean) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [localError, setLocalError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (sending || disabled || (!text.trim() && !image)) return;
    const ok = await onSend(text.trim(), image);
    if (ok) {
      setText("");
      setImage(null);
      typingRef.current = false;
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function onChange(value: string) {
    setText(value);
    const typing = value.length > 0;
    if (typing !== typingRef.current) {
      typingRef.current = typing;
      onTyping?.(typing);
    }
  }

  function pickFile(file: File | null) {
    setLocalError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setLocalError("Lampiran harus berupa foto.");
    if (file.size > MAX_IMAGE) return setLocalError("Foto maksimal 5 MB.");
    setImage(file);
  }

  return (
    <div className={compact ? "mini-compose" : "chat-compose"}>
      {image && (
        <span className="file-chip">
          <Icon name="image" size={14} /> {image.name}
          <button type="button" aria-label="Hapus lampiran" onClick={() => setImage(null)}>
            <Icon name="x" size={13} />
          </button>
        </span>
      )}
      <form onSubmit={submit}>
        <button
          type="button"
          className="attach icon-btn"
          aria-label="Lampirkan foto"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
        >
          <Icon name="paperclip" size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            pickFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <input
          className="input"
          value={text}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={2000}
          aria-label="Tulis pesan"
          disabled={disabled}
        />
        {compact ? (
          <button type="submit" className="icon-btn" aria-label="Kirim" disabled={sending || disabled}>
            {sending ? <span className="spinner" /> : <Icon name="send" size={18} />}
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={sending || disabled || (!text.trim() && !image)}>
            {sending ? <span className="spinner" /> : <Icon name="send" size={16} />} Kirim
          </button>
        )}
      </form>
      {localError && <p className="field-error" style={{ marginTop: 8 }}>{localError}</p>}
      {!compact && <p className="hint">Tekan Enter untuk mengirim · Lampirkan foto hingga 5 MB</p>}
    </div>
  );
}
