"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import Icon from "@/src/components/ui/Icon";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { loginSchema } from "@/src/schemas/auth";
import PasswordInput from "./PasswordInput";

/** Hanya izinkan redirect internal untuk mencegah open redirect. */
function safeNext(role: string): string | null {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith(`/${role}`) || next.startsWith("//")) return null;
  return next;
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const registered = new URLSearchParams(window.location.search).get("registered");
    if (registered === "customer") {
      setNotice("Akun berhasil dibuat. Silakan masuk untuk mulai memesan survei.");
    } else if (registered === "surveyor") {
      setNotice(
        "Pendaftaran surveyor terkirim. Kamu sudah bisa masuk; order dapat diterima setelah akun diverifikasi tim CKIN.",
      );
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validation = loginSchema.safeParse({ email, password, remember });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ user: { role: string }; redirectTo: string }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(validation.data) },
      );
      // Full reload supaya proxy & layout membaca cookie sesi yang baru.
      window.location.href = safeNext(data.user.role) ?? data.redirectTo;
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow">Selamat datang kembali</p>
      <h2 className="auth-title">Langkah baru, kos baru.</h2>
      <p className="auth-lead">Masuk untuk melanjutkan perjalanan cari kosmu.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {notice && (
          <div className="alert alert-success" role="status">
            <Icon name="checkCircle" size={17} />
            <span>{notice}</span>
          </div>
        )}
        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <div className="input-wrap">
            <Icon name="mail" size={17} />
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="nama@email.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Kata sandi
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </div>

        <div className="auth-row">
          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Ingat saya
          </label>
          <a className="text-link" href="mailto:bantuan@ckin.id?subject=Lupa%20kata%20sandi">
            Lupa kata sandi?
          </a>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <Icon name="alert" size={17} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : <Icon name="arrowRight" size={17} />}
          {loading ? "Memeriksa akun…" : "Masuk ke akun"}
        </button>

        <p className="auth-switch">
          Belum punya akun? <Link href="/register">Daftar sekarang</Link>
        </p>
        <p className="auth-safe">
          <Icon name="shield" size={15} /> Data pribadimu aman bersama CKIN.
        </p>
      </form>
    </>
  );
}
