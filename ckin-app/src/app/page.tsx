import Image from "next/image";
import Logo from "@/src/components/ui/Logo";
import { LangToggle, ThemeToggle } from "@/src/components/ui/Preferences";
import Link from "next/link";
import Icon from "@/src/components/ui/Icon";

const STEPS = [
  {
    title: "Pilih area & jumlah kos",
    text: "Tentukan kecamatan tujuan dan 1–4 kos yang ingin dicek, baik pilihanmu sendiri atau rekomendasi surveyor.",
  },
  {
    title: "Bayar & tentukan jadwal",
    text: "Pilih tanggal survei, lalu bayar dengan aman. Pesanan langsung terlihat oleh surveyor di area tersebut.",
  },
  {
    title: "Surveyor cek langsung",
    text: "Surveyor lokal memeriksa kamar, fasilitas, sinyal, tekanan air, sampai lingkungan sekitar.",
  },
  {
    title: "Terima laporan lengkap",
    text: "Foto, video, temuan, dan catatan surveyor masuk ke dashboard. Tanya apa saja lewat chat.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" className="brand-link" aria-label="CKIN Cari Kost">
          <Logo size={38} />
        </Link>
        <nav aria-label="Navigasi beranda">
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#peran">Untuk surveyor</a>
          <a href="mailto:bantuan@ckin.id">Bantuan</a>
        </nav>
        <div className="actions">
          <LangToggle />
          <ThemeToggle />
          <Link className="btn btn-secondary btn-sm" href="/login">
            Masuk
          </Link>
          <Link className="btn btn-primary btn-sm" href="/register">
            Daftar gratis
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div>
          <p className="eyebrow">Pindah kos, tanpa waswas</p>
          <h1>
            Kamu pilih areanya. <em>Kami cek kosnya.</em>
          </h1>
          <p className="lead">
            CKIN menghubungkanmu dengan surveyor lokal yang mengecek kondisi kamar, fasilitas, dan
            lingkungan kos — jadi kamu bisa memilih dengan yakin tanpa harus datang duluan.
          </p>
          <div className="cta">
            <Link className="btn btn-primary" href="/register">
              <Icon name="arrowRight" size={17} /> Mulai survei kos
            </Link>
            <Link className="btn btn-secondary" href="/register-surveyor">
              Jadi surveyor
            </Link>
          </div>
          <div className="proof">
            <div>
              <strong>1.200+</strong>
              <span>pencari kos terbantu</span>
            </div>
            <div>
              <strong>4,9/5</strong>
              <span>rating surveyor</span>
            </div>
            <div>
              <strong>1–4 kos</strong>
              <span>per pesanan survei</span>
            </div>
          </div>
        </div>

        <div className="landing-visual">
          <Image
            src="/images/auth-hero.jpg"
            alt="Bangunan kos asri dengan taman"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
          />
          <div className="landing-float two">
            <span className="pill tone-success">Laporan diterima</span>
          </div>
          <div className="landing-float one">
            <span className="avatar lime">BW</span>
            <div>
              <strong>“AC &amp; kamar mandi dalam berfungsi, Wi-Fi 42 Mbps.”</strong>
              <small>Catatan surveyor · Kos Griya Soka, Depok</small>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="cara-kerja">
        <div className="head">
          <p className="eyebrow">Cara kerja</p>
          <h2>Empat langkah dari cari sampai yakin.</h2>
          <p>Semua progres survei, laporan, dan percakapan dengan surveyor tersimpan rapi di satu tempat.</p>
        </div>
        <div className="steps">
          {STEPS.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="n">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split-band" id="peran">
        <div className="inner">
          <article className="role-panel light">
            <p className="eyebrow">Untuk pencari kos</p>
            <h3>Cek dulu, baru pindah.</h3>
            <ul>
              <li>Survei 1–4 kos dalam satu pesanan</li>
              <li>Laporan foto, video, dan temuan jujur</li>
              <li>Chat langsung dengan surveyor</li>
            </ul>
            <Link className="btn btn-primary" href="/register">
              Daftar sebagai customer
            </Link>
          </article>
          <article className="role-panel">
            <p className="eyebrow">Untuk surveyor</p>
            <h3>Kenal areamu? Jadikan penghasilan.</h3>
            <ul>
              <li>Order dari kecamatan yang kamu pilih</li>
              <li>Atur jadwal sesuai waktu luang</li>
              <li>Pendapatan transparan per order</li>
            </ul>
            <Link className="btn btn-lime" href="/register-surveyor">
              Daftar sebagai surveyor
            </Link>
          </article>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© 2026 CKIN — cek dulu, baru pindah.</span>
        <span className="foot-links">
          <Link href="/kebijakan-privasi">Privasi</Link> · <Link href="/syarat-ketentuan">Syarat pengguna</Link> ·{" "}
          <Link href="/syarat-ketentuan/surveyor">Syarat surveyor</Link>
        </span>
      </footer>
    </div>
  );
}
