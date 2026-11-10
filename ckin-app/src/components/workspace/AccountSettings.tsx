"use client";

import { useEffect, useState, type FormEvent } from "react";
import AreaFields, { emptyArea, type AreaValue, type District } from "@/src/components/auth/AreaFields";
import PasswordInput from "@/src/components/auth/PasswordInput";
import Icon from "@/src/components/ui/Icon";
import { PageHeader, Skeleton, StatusPill } from "@/src/components/ui/common";
import { apiFetch, errorMessage } from "@/src/lib/client-api";
import { formatDate, initials, regionLabel } from "@/src/lib/format";
import {
  changePasswordSchema,
  updateCustomerProfileSchema,
  updateSurveyorProfileSchema,
} from "@/src/schemas/auth";
import { useWorkspace, type WorkspaceUser } from "./WorkspaceProvider";

const VERIFICATION = {
  PENDING: { label: "Menunggu verifikasi", tone: "warning" as const },
  APPROVED: { label: "Terverifikasi", tone: "success" as const },
  REJECTED: { label: "Ditolak", tone: "danger" as const },
};

function toArea(user: WorkspaceUser): AreaValue {
  const d = user.domicile;
  if (!d) return emptyArea;
  return {
    provinceId: d.provinceId ?? "",
    province: d.province ?? "",
    cityId: d.cityId ?? "",
    city: d.city ?? "",
    districtId: d.districtId ?? "",
    district: d.district ?? "",
  };
}

function toCoverage(user: WorkspaceUser): District[] {
  const c = user.coverageArea;
  if (!c) return [];
  return c.districts.map((name, index) => ({ id: c.districtIds?.[index] ?? name, name }));
}

function ProfileForm({ user }: { user: WorkspaceUser }) {
  const { role, setUser } = useWorkspace();
  const [fullname, setFullname] = useState(user.fullname);
  const [phone, setPhone] = useState(user.phone);
  const [area, setArea] = useState<AreaValue>(toArea(user));
  const [coverage, setCoverage] = useState<District[]>(toCoverage(user));
  const [experience, setExperience] = useState(user.experience ?? "");
  const [accepting, setAccepting] = useState(user.acceptingOrders ?? true);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const hasArea = Boolean(area.districtId);
    const payload =
      role === "customer"
        ? { fullname, phone, domicile: hasArea ? area : null }
        : {
            fullname,
            phone,
            domicile: area,
            coverageDistricts: coverage,
            experience,
            acceptingOrders: accepting,
          };

    const validation =
      role === "customer"
        ? updateCustomerProfileSchema.safeParse(payload)
        : updateSurveyorProfileSchema.safeParse(payload);
    if (!validation.success) {
      setStatus({ type: "error", text: validation.error.issues[0].message });
      return;
    }

    setSaving(true);
    try {
      const data = await apiFetch<{ user: WorkspaceUser }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(validation.data),
      });
      setUser(data.user);
      setPhone(data.user.phone);
      setStatus({ type: "success", text: "Profil berhasil disimpan." });
    } catch (err) {
      setStatus({ type: "error", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <div className="card-head">
        <div>
          <h2 className="card-title">Profil akun</h2>
          <p className="card-sub">Data ini terlihat oleh {role === "customer" ? "surveyor yang menangani pesananmu" : "customer pada order yang kamu ambil"}.</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="set-name">
            Nama lengkap
          </label>
          <input id="set-name" className="input" value={fullname} onChange={(e) => setFullname(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="set-phone">
            Nomor WhatsApp
          </label>
          <input id="set-phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field span-2">
          <label className="label" htmlFor="set-email">
            Email
          </label>
          <input id="set-email" className="input" value={user.email} disabled />
          <span className="hint">Email dipakai untuk masuk dan tidak dapat diubah.</span>
        </div>
      </div>

      <div className="form-section">
        <div className="section-title" style={{ marginBottom: 16 }}>
          <span className="num">
            <Icon name="pin" size={15} />
          </span>
          <div>
            <h2>{role === "customer" ? "Domisili (opsional)" : "Domisili & area jangkauan"}</h2>
            <p>
              {role === "customer"
                ? "Membantu kami menyarankan area survei di sekitarmu."
                : "Order tersedia dicocokkan dengan kecamatan yang kamu pilih."}
            </p>
          </div>
        </div>
        {role === "customer" ? (
          <AreaFields value={area} onChange={setArea} />
        ) : (
          <AreaFields value={area} onChange={setArea} coverage={coverage} onCoverageChange={setCoverage} />
        )}
      </div>

      {role === "surveyor" && (
        <div className="form-section">
          <div className="field">
            <label className="label" htmlFor="set-exp">
              Pengalaman singkat
            </label>
            <textarea
              id="set-exp"
              className="textarea"
              maxLength={600}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>
          <div className="toggle" style={{ marginTop: 18 }}>
            <div>
              <strong>Aktif menerima order</strong>
              <small>Matikan sementara jika kamu sedang tidak bisa survei.</small>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={accepting}
              aria-label="Aktif menerima order"
              className="switch"
              onClick={() => setAccepting((v) => !v)}
            />
          </div>
        </div>
      )}

      {status && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"}`} style={{ marginTop: 20 }} role="status">
          <Icon name={status.type === "success" ? "checkCircle" : "alert"} size={17} />
          <span>{status.text}</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? <span className="spinner" /> : <Icon name="check" size={16} />}
          {saving ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const validation = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!validation.success) {
      setStatus({ type: "error", text: validation.error.issues[0].message });
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/profile/password", { method: "PATCH", body: JSON.stringify(validation.data) });
      setCurrent("");
      setNew("");
      setConfirm("");
      setStatus({ type: "success", text: "Kata sandi berhasil diperbarui." });
    } catch (err) {
      setStatus({ type: "error", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2 className="card-title">Keamanan</h2>
      <p className="card-sub" style={{ marginBottom: 20 }}>
        Ganti kata sandi secara berkala. Minimal 8 karakter, gabungkan huruf dan angka.
      </p>
      <div className="form-grid three">
        <div className="field">
          <label className="label" htmlFor="pw-current">
            Kata sandi saat ini
          </label>
          <PasswordInput id="pw-current" name="currentPassword" value={currentPassword} onChange={setCurrent} autoComplete="current-password" withIcon={false} placeholder="••••••••" />
        </div>
        <div className="field">
          <label className="label" htmlFor="pw-new">
            Kata sandi baru
          </label>
          <PasswordInput id="pw-new" name="newPassword" value={newPassword} onChange={setNew} autoComplete="new-password" withIcon={false} placeholder="Kata sandi baru" />
        </div>
        <div className="field">
          <label className="label" htmlFor="pw-confirm">
            Ulangi kata sandi baru
          </label>
          <PasswordInput id="pw-confirm" name="confirmPassword" value={confirmPassword} onChange={setConfirm} autoComplete="new-password" withIcon={false} placeholder="Ulangi" />
        </div>
      </div>
      {status && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"}`} style={{ marginTop: 18 }} role="status">
          <Icon name={status.type === "success" ? "checkCircle" : "alert"} size={17} />
          <span>{status.text}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button className="btn btn-secondary" type="submit" disabled={saving}>
          {saving ? <span className="spinner" /> : <Icon name="lock" size={16} />}
          Perbarui kata sandi
        </button>
      </div>
    </form>
  );
}

export default function AccountSettings() {
  const { role, user, loading, logout } = useWorkspace();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <PageHeader
        eyebrow={role === "customer" ? "Ruang pengguna" : "Ruang surveyor"}
        title="Pengaturan akun"
        subtitle="Kelola profil, domisili, dan keamanan akunmu."
      />

      {loading || !user || !mounted ? (
        <div className="settings-grid">
          <div className="card stack">
            <Skeleton height={22} width={160} />
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
          </div>
          <div className="card">
            <Skeleton height={120} />
          </div>
        </div>
      ) : (
        <div className="settings-grid">
          <div className="stack">
            <ProfileForm key={user.id} user={user} />
            <PasswordForm />
          </div>

          <aside className="stack">
            <div className="card profile-summary">
              <span className="avatar lg lime">{initials(user.fullname)}</span>
              <strong>{user.fullname}</strong>
              <small>{user.email}</small>
              <div className="kv">
                <div>
                  <span>Jenis akun</span>
                  <strong>{role === "customer" ? "Customer" : "Surveyor"}</strong>
                </div>
                <div>
                  <span>Bergabung</span>
                  <strong>{formatDate(user.createdAt, "long")}</strong>
                </div>
                {user.domicile?.district && (
                  <div>
                    <span>Domisili</span>
                    <strong>{regionLabel(user.domicile.district)}</strong>
                  </div>
                )}
                {role === "surveyor" && user.verificationStatus && (
                  <div>
                    <span>Status mitra</span>
                    <StatusPill tone={VERIFICATION[user.verificationStatus].tone}>
                      {VERIFICATION[user.verificationStatus].label}
                    </StatusPill>
                  </div>
                )}
              </div>
            </div>
            {role === "surveyor" && user.verificationStatus === "REJECTED" && user.rejectionReason && (
              <div className="alert alert-danger">
                <Icon name="alert" size={17} />
                <div>
                  <strong>Alasan penolakan</strong>
                  {user.rejectionReason}
                </div>
              </div>
            )}
            <button type="button" className="btn btn-secondary btn-block" onClick={logout}>
              <Icon name="logout" size={16} /> Keluar dari akun
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
