"use client";

import Link from "next/link";
import Icon from "@/src/components/ui/Icon";
import Logo from "@/src/components/ui/Logo";
import { LangToggle, ThemeToggle, usePreferences } from "@/src/components/ui/Preferences";
import { LEGAL_HREF, type LegalDoc } from "@/src/lib/legal";

const TABS = [
  { href: LEGAL_HREF.customer, label: { id: "Pengguna", en: "Customers" } },
  { href: LEGAL_HREF.surveyor, label: { id: "Surveyor", en: "Surveyors" } },
  { href: LEGAL_HREF.privacy, label: { id: "Privasi", en: "Privacy" } },
];

/** Halaman Syarat & Ketentuan / Kebijakan Privasi (publik, dua bahasa). */
export default function LegalPage({ doc, current }: { doc: LegalDoc; current: string }) {
  const { lang } = usePreferences();
  const t = (v: { id: string; en: string }) => v[lang];
  const updated = new Date(`${doc.updated}T12:00:00+07:00`).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="legal" data-no-translate>
      <header className="landing-nav legal-nav">
        <Link href="/" className="brand-link" aria-label="CKIN Cari Kost">
          <Logo size={36} />
        </Link>
        <div className="actions">
          <LangToggle />
          <ThemeToggle />
          <Link className="btn btn-secondary btn-sm" href="/login">
            {lang === "en" ? "Log in" : "Masuk"}
          </Link>
        </div>
      </header>

      <main className="legal-main">
        <nav className="tabs tabs-scroll legal-tabs" aria-label={lang === "en" ? "Legal documents" : "Dokumen legal"}>
          {TABS.map((tab) => (
            <Link key={tab.href} href={tab.href} className={`tab ${current === tab.href ? "active" : ""}`}>
              {tab.label[lang]}
            </Link>
          ))}
        </nav>

        <article className="card legal-doc">
          <p className="eyebrow">{lang === "en" ? "Legal" : "Legal"} · CKIN</p>
          <h1>{t(doc.title)}</h1>
          <p className="legal-updated">
            <Icon name="clock" size={14} /> {lang === "en" ? "Last updated" : "Terakhir diperbarui"} {updated}
          </p>
          <p className="legal-intro">{t(doc.intro)}</p>

          <ol className="legal-toc">
            {doc.sections.map((s, i) => (
              <li key={i}>
                <a href={`#s${i + 1}`}>{t(s.title)}</a>
              </li>
            ))}
          </ol>

          {doc.sections.map((s, i) => (
            <section key={i} id={`s${i + 1}`} className="legal-section">
              <h2>{t(s.title)}</h2>
              <ul>
                {s.points.map((p, j) => (
                  <li key={j}>{t(p)}</li>
                ))}
              </ul>
            </section>
          ))}

          <div className="alert alert-info" style={{ marginTop: 28 }}>
            <Icon name="info" size={18} />
            <div>
              {lang === "en" ? "Questions about this document? Email " : "Ada pertanyaan tentang dokumen ini? Email "}
              <a href="mailto:bantuan@ckin.id">bantuan@ckin.id</a>.
            </div>
          </div>
        </article>
      </main>

      <footer className="legal-foot">
        <span>© 2026 CKIN — {lang === "en" ? "check first, then move." : "cek dulu, baru pindah."}</span>
        <Link href="/">{lang === "en" ? "Back to home" : "Kembali ke beranda"}</Link>
      </footer>
    </div>
  );
}
