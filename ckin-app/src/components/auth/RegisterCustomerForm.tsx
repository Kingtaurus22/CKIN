"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Icon from "@/src/components/ui/Icon";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { registerCustomerSchema } from "@/src/schemas/auth";
import { RolePicker } from "./AuthLayout";
import PasswordInput from "./PasswordInput";

type Form = {
  fullname: string;
  email: string;
  phone: string;
  password: string;
  agreement: boolean;
};

export default function RegisterCustomerForm() {
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    agreement: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validation = registerCustomerSchema.safeParse(form);
    if (!validation.success) {
      const errors: Partial<Record<keyof Form, string>> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as keyof Form;
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validation.data),
      });
      router.push(`/login?registered=customer`);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow">Mulai dari sini</p>
      <h2 className="auth-title">Daftar sebagai customer.</h2>
      <p className="auth-lead">Isi data berikut untuk membuat akun customer CKIN.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <span className="label">Pilih peran</span>
          <RolePicker active="customer" />
        </div>

        <div className="field">
          <label className="label" htmlFor="fullname">
            Nama lengkap
          </label>
          <input
            id="fullname"
            className="input"
            placeholder="Nama sesuai identitas"
            autoComplete="name"
            value={form.fullname}
            onChange={(e) => update("fullname", e.target.value)}
            aria-invalid={Boolean(fieldErrors.fullname) || undefined}
          />
          {fieldErrors.fullname && <span className="field-error">{fieldErrors.fullname}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <div className="input-wrap">
            <Icon name="mail" size={17} />
            <input
              id="email"
              type="email"
              className="input"
              placeholder="nama@email.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={Boolean(fieldErrors.email) || undefined}
            />
          </div>
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="phone">
            Nomor WhatsApp
          </label>
          <input
            id="phone"
            type="tel"
            className="input"
            placeholder="+62 812 3456 7890"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={Boolean(fieldErrors.phone) || undefined}
          />
          {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Kata sandi
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={(value) => update("password", value)}
            autoComplete="new-password"
            placeholder="Buat kata sandi"
            invalid={Boolean(fieldErrors.password)}
          />
          <span className={fieldErrors.password ? "field-error" : "hint"}>
            {fieldErrors.password ?? "Minimal 8 karakter, gabungkan huruf dan angka."}
          </span>
        </div>

        <div className="field">
          <label className="check">
            <input
              type="checkbox"
              checked={form.agreement}
              onChange={(e) => update("agreement", e.target.checked)}
            />
            <span>
            Saya menyetujui{" "}
            <a href="/syarat-ketentuan" target="_blank" rel="noreferrer" className="legal-link">
              Syarat &amp; Ketentuan
            </a>{" "}
            dan{" "}
            <a href="/kebijakan-privasi" target="_blank" rel="noreferrer" className="legal-link">
              Kebijakan Privasi
            </a>
            .
            </span>
          </label>
          <span className={fieldErrors.agreement ? "field-error" : "hint"}>
            {fieldErrors.agreement ?? "Formulir surveyor memiliki langkah pendaftaran yang berbeda."}
          </span>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <Icon name="alert" size={17} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : <Icon name="arrowRight" size={17} />}
          {loading ? "Membuat akun…" : "Buat akun pengguna"}
        </button>

        <p className="auth-switch">
          Sudah punya akun? <Link href="/login">Masuk di sini</Link>
        </p>
      </form>
    </>
  );
}
