import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import PreferencesProvider from "@/src/components/ui/Preferences";
import "./globals.css";

/** Pasang tema & bahasa tersimpan sebelum halaman tampil (mencegah kedipan). */
const PREFS_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('ckin_theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;if(localStorage.getItem('ckin_lang')==='en'){d.lang='en';d.classList.add('i18n-pending');setTimeout(function(){d.classList.remove('i18n-pending')},1500)}}catch(e){}})();`;

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "CKIN Cari Kost — cek dulu, baru pindah",
    template: "%s · CKIN Cari Kost",
  },
  description:
    "Surveyor lokal CKIN membantu mengecek kondisi kamar, fasilitas, dan lingkungan kos sebelum kamu pindah.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
