
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
  },
  {
    label: "Pesanan saya",
    href: "/orders",
  },
  {
    label: "Pesan",
    href: "/messages",
    badge: 2,
  },
  {
    label: "Saldo saya",
    href: "/balance",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-[#4A8B78] text-white">
      {/* Logo */}
      <div className="flex justify-center px-4 py-6">
        <img
          src="/ckin-logo.png"
          alt="CKIN Cari Kost"
          className="h-20 w-auto object-contain"
        />
      </div>

      {/* Role */}
      <div className="mx-4 rounded-xl bg-[#20594F] px-4 py-4">
        <span className="text-sm font-medium">
          Akun pengguna
        </span>
      </div>

      {/* Menu */}
      <nav className="mt-6 flex flex-col gap-2 px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#C5F36B] text-[#20594F]"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <span>{item.label}</span>

              {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C5F36B] px-1 text-xs font-semibold text-[#20594F]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Help */}
      <div className="mx-4 mt-auto rounded-xl bg-[#20594F] p-4">
        <p className="text-sm font-semibold">
          Butuh bantuan?
        </p>

        <p className="mt-2 text-xs leading-5 text-white/80">
          Hubungi tim CKIN jika kamu mengalami kendala.
        </p>

        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-[#C5F36B] px-3 py-2 text-sm font-semibold text-[#20594F] transition hover:bg-[#D5F895]"
        >
          Hubungi kami
        </button>
      </div>

      {/* Copyright */}
      <div className="mx-4 mb-4 mt-6 border-t border-white/20 pt-4">
        <p className="mt-4 px-4 text-xs text-white/60">
          © 2026 CKIN
        </p>
      </div>
    </aside>
  );
}
