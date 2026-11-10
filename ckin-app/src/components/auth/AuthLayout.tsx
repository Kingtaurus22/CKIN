import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "@/src/components/ui/Icon";
import Logo from "@/src/components/ui/Logo";
import { LangToggle, ThemeToggle } from "@/src/components/ui/Preferences";

/** Panel foto kiri untuk halaman login & daftar customer (Figma: "Kos yang tepat…"). */
export function CustomerHero() {
  return (
    <section className="auth-hero">
      <Image
        className="bg"
        src="/images/auth-hero.jpg"
        alt="Halaman kos asri dengan tanaman tropis"
        fill
        priority
        sizes="(max-width: 900px) 100vw, 45vw"
      />
      <div className="shade" />
      <Link href="/" className="logo" aria-label="Beranda CKIN">
        <Logo size={40} className="on-dark" />
      </Link>
      <div className="content">
        <span className="tagline">Kenal kosnya. Tenang pindahnya.</span>
        <h1>Kos yang tepat, tanpa harus datang duluan.</h1>
        <p className="lead">
          Surveyor lokal bantu cek kondisi, fasilitas, dan lingkungan kos. Kamu tinggal pilih
          dengan yakin.
        </p>
        <div className="auth-proof">
          <div className="faces" aria-hidden="true">
            <span>BW</span>
            <span>NR</span>
            <span>DP</span>
          </div>
          <div>
            <span className="stars">★★★★★</span>
            1.200+ pencari kos sudah terbantu
          </div>
        </div>
      </div>
    </section>
  );
}

/** Panel kiri pendaftaran surveyor (Figma: "Kenal areamu…"). */
export function SurveyorHero() {
  return (
    <section className="auth-hero tall">
      <div className="bg-top">
        <Image
          className="bg"
          src="/images/auth-hero.jpg"
          alt="Bangunan kos dengan taman"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 40vw"
          style={{ objectPosition: "30% top" }}
        />
      </div>
      <div className="shade" />
      <Link href="/" className="logo" aria-label="Beranda CKIN">
        <Logo size={40} className="on-dark" />
      </Link>
      <div className="content">
        <span className="tagline">Jadi mata dan telinga pencari kos</span>
        <h1>Kenal areamu. Bantu mereka menemukan rumah.</h1>
        <p className="lead">
          Gabung sebagai surveyor lokal CKIN. Cek kos dengan teliti, bantu customer memilih dengan
          yakin.
        </p>
        <div className="perks-desktop">
          <ul className="auth-perks">
            <li>
              <Icon name="surveyor" size={22} />
              <div>
                <strong>Order dekat domisilimu</strong>
                <small>Pilih lebih dari satu area yang kamu kenal.</small>
              </div>
            </li>
            <li>
              <Icon name="calendar" size={22} />
              <div>
                <strong>Jadwal yang kamu atur</strong>
                <small>Ambil order yang sesuai dengan waktu luangmu.</small>
              </div>
            </li>
            <li>
              <Icon name="wallet" size={22} />
              <div>
                <strong>Pendapatan transparan</strong>
                <small>Lihat pendapatan bersih sebelum mengambil order.</small>
              </div>
            </li>
          </ul>
          <div className="auth-after">
            <h3>SETELAH MENDAFTAR</h3>
            <ol>
              <li>Tim CKIN meninjau data dan identitasmu.</li>
              <li>Hasil verifikasi dikirim lewat email.</li>
              <li>Akun aktif, siap menerima order.</li>
            </ol>
            <small>Estimasi peninjauan 1–3 hari kerja.</small>
          </div>
          <p className="fineprint">CKIN · Cari Kost — cek dulu, baru pindah.</p>
        </div>
      </div>
    </section>
  );
}

export function AuthPanel({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <section className="auth-panel">
      <div className="auth-top">
        <LangToggle />
        <ThemeToggle />
        <p className="auth-help">
          Butuh bantuan? <a href="mailto:bantuan@ckin.id">Hubungi kami ↗</a>
        </p>
      </div>
      <div className={`auth-form-wrap ${wide ? "wide" : ""}`}>{children}</div>
      <footer className="auth-foot">
        <span>© 2026 CKIN</span>
        <span className="foot-links">
          <Link href="/kebijakan-privasi">Privasi</Link> · <Link href="/syarat-ketentuan">Syarat &amp; ketentuan</Link>
        </span>
      </footer>
    </section>
  );
}

export function RolePicker({ active }: { active: "customer" | "surveyor" }) {
  return (
    <div className="role-grid" role="radiogroup" aria-label="Pilih peran">
      <Link
        href="/register"
        className={`role-card ${active === "customer" ? "selected" : ""}`}
        role="radio"
        aria-checked={active === "customer"}
      >
        <span className="top">
          <Icon name="home" size={19} />
          <span className="radio" />
        </span>
        <strong>Pengguna</strong>
        <small>Cari &amp; survei kos</small>
      </Link>
      <Link
        href="/register-surveyor"
        className={`role-card ${active === "surveyor" ? "selected" : ""}`}
        role="radio"
        aria-checked={active === "surveyor"}
      >
        <span className="top">
          <Icon name="surveyor" size={19} />
          <span className="radio" />
        </span>
        <strong>Surveyor</strong>
        <small>
          {active === "surveyor" ? "Bantu survei, dapat penghasilan" : "Daftar surveyor di halaman terpisah"}
        </small>
      </Link>
    </div>
  );
}
