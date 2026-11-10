"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Icon from "@/src/components/ui/Icon";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { registerSurveyorSchema } from "@/src/schemas/auth";
import AreaFields, { UploadBox, emptyArea, type AreaValue, type District } from "./AreaFields";
import { RolePicker } from "./AuthLayout";
import PasswordInput from "./PasswordInput";

const MAX_FILE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png"];

type Errors = Partial<
  Record<
    "fullname" | "email" | "phone" | "password" | "area" | "coverage" | "experience" | "ktp" | "selfie" | "agreement",
    string
  >
>;

function fileError(file: File | null, label: string) {
  if (!file) return `${label} wajib diunggah.`;
  if (!IMAGE_TYPES.includes(file.type)) return `${label} harus JPG atau PNG.`;
  if (file.size > MAX_FILE) return `${label} maksimal 5 MB.`;
  return undefined;
}

export default function RegisterSurveyorForm() {
  const router = useRouter();
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [area, setArea] = useState<AreaValue>(emptyArea);
  const [coverage, setCoverage] = useState<District[]>([]);
  const [experience, setExperience] = useState("");
  const [ktp, setKtp] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [agreement, setAgreement] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validation = registerSurveyorSchema.safeParse({
      fullname,
      email,
      phone,
      password,
      domicile: area,
      coverageDistricts: coverage,
      experience,
      agreement,
    });

    const nextErrors: Errors = {};
    if (!validation.success) {
      for (const issue of validation.error.issues) {
        const key = issue.path[0];
        const mapped =
          key === "domicile" ? "area" : key === "coverageDistricts" ? "coverage" : (key as keyof Errors);
        nextErrors[mapped] ??= issue.message;
      }
    }
    nextErrors.ktp = fileError(ktp, "Foto KTP");
    nextErrors.selfie = fileError(selfie, "Swafoto dengan KTP");

    if (Object.values(nextErrors).some(Boolean) || !validation.success) {
      setErrors(nextErrors);
      setError("Periksa kembali isian yang ditandai.");
      return;
    }
    setErrors({});

    const data = validation.data;
    const formData = new FormData();
    formData.append("fullname", data.fullname);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("password", password);
    formData.append("provinceId", area.provinceId);
    formData.append("province", area.province);
    formData.append("cityId", area.cityId);
    formData.append("city", area.city);
    formData.append("districtId", area.districtId);
    formData.append("district", area.district);
    formData.append("coverageDistricts", JSON.stringify(data.coverageDistricts));
    formData.append("experience", data.experience);
    formData.append("agreement", String(agreement));
    formData.append("ktp", ktp as File);
    formData.append("selfie", selfie as File);

    setLoading(true);
    try {
      await apiFetch("/api/auth/register-surveyor", { method: "POST", body: formData });
      router.push("/login?registered=surveyor");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow" style={{ fontSize: 10 }}>
        Mulai perjalanan sebagai mitra
      </p>
      <h2 className="auth-title">Daftar sebagai surveyor.</h2>
      <p className="auth-lead">Ceritakan tentang dirimu dan area yang kamu kuasai.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <RolePicker active="surveyor" />

        <div className="alert alert-info">
          <Icon name="shield" size={18} />
          <div>
            <strong style={{ fontWeight: 500 }}>Pendaftaran mitra ditinjau terlebih dahulu</strong>
            Kamu baru dapat menerima order setelah akun dan dokumen disetujui tim CKIN. Proses
            peninjauan 1–3 hari kerja.
          </div>
        </div>

        {/* 1. Data akun */}
        <div>
          <div className="section-title">
            <span className="num">1</span>
            <div>
              <h2>Data akun</h2>
              <p>Gunakan data asli dan nomor yang bisa dihubungi.</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="fullname">
                Nama lengkap sesuai KTP
              </label>
              <input
                id="fullname"
                className="input"
                autoComplete="name"
                placeholder="Nama sesuai KTP"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                aria-invalid={Boolean(errors.fullname) || undefined}
              />
              {errors.fullname && <span className="field-error">{errors.fullname}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email) || undefined}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="phone">
                Nomor WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                className="input"
                autoComplete="tel"
                placeholder="+62 812 9876 5432"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={Boolean(errors.phone) || undefined}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
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
                autoComplete="new-password"
                placeholder="Buat kata sandi"
                invalid={Boolean(errors.password)}
                withIcon={false}
              />
              <span className={errors.password ? "field-error" : "hint"}>
                {errors.password ?? "Minimal 8 karakter, gabungkan huruf dan angka."}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Domisili & area jangkauan */}
        <div className="form-section">
          <div className="section-title">
            <span className="num">2</span>
            <div>
              <h2>Domisili &amp; area jangkauan</h2>
              <p>Order dicocokkan dengan area yang kamu pilih, bukan seluruh kota.</p>
            </div>
          </div>
          <AreaFields
            value={area}
            onChange={setArea}
            coverage={coverage}
            onCoverageChange={setCoverage}
            errors={{ area: errors.area, coverage: errors.coverage }}
          />
          <div className="field" style={{ marginTop: 18 }}>
            <label className="label" htmlFor="experience">
              Pengalaman singkat
            </label>
            <textarea
              id="experience"
              className="textarea"
              maxLength={600}
              placeholder="Contoh: Saya tinggal di Depok selama 5 tahun dan mengenal area kampus UGM serta UNY…"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              aria-invalid={Boolean(errors.experience) || undefined}
            />
            <span className={errors.experience ? "field-error" : "hint"}>
              {errors.experience ??
                "Ceritakan pengalaman survei, pengetahuan area, atau kemampuan dokumentasimu."}
            </span>
          </div>
        </div>

        {/* 3. Verifikasi identitas */}
        <div className="form-section">
          <div className="section-title">
            <span className="num">3</span>
            <div>
              <h2>Verifikasi identitas</h2>
              <p>Dokumen hanya digunakan untuk verifikasi mitra dan disimpan dengan aman.</p>
            </div>
          </div>
          <div className="form-grid">
            <UploadBox
              id="ktp"
              label="Foto KTP"
              icon="idCard"
              hint="Pastikan seluruh sisi KTP dan tulisan terlihat jelas."
              file={ktp}
              onFile={(file) => {
                setKtp(file);
                setErrors((prev) => ({ ...prev, ktp: file ? fileError(file, "Foto KTP") : prev.ktp }));
              }}
              error={errors.ktp}
            />
            <UploadBox
              id="selfie"
              label="Swafoto dengan KTP"
              icon="camera"
              hint="Wajah dan KTP terlihat jelas, tanpa filter atau masker."
              file={selfie}
              onFile={(file) => {
                setSelfie(file);
                setErrors((prev) => ({
                  ...prev,
                  selfie: file ? fileError(file, "Swafoto dengan KTP") : prev.selfie,
                }));
              }}
              error={errors.selfie}
            />
          </div>
        </div>

        <div className="field">
          <label className="check">
            <input type="checkbox" checked={agreement} onChange={(e) => setAgreement(e.target.checked)} />
            <span>
            Saya menyetujui{" "}
            <a href="/syarat-ketentuan/surveyor" target="_blank" rel="noreferrer" className="legal-link">
              Perjanjian Kemitraan &amp; Syarat Surveyor
            </a>{" "}
            serta{" "}
            <a href="/kebijakan-privasi" target="_blank" rel="noreferrer" className="legal-link">
              Kebijakan Privasi
            </a>{" "}
            CKIN. Data yang saya berikan benar.
            </span>
          </label>
          {errors.agreement && <span className="field-error">{errors.agreement}</span>}
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <Icon name="alert" size={17} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : <Icon name="arrowRight" size={17} />}
          {loading ? "Mengunggah dokumen…" : "Kirim pendaftaran surveyor"}
        </button>

        <p className="auth-switch">
          Sudah punya akun? <Link href="/login">Masuk di sini</Link>
        </p>
      </form>
    </>
  );
}
