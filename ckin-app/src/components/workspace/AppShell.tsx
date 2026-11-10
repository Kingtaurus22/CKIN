"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon, { type IconName } from "@/src/components/ui/Icon";
import Logo from "@/src/components/ui/Logo";
import { initials, shortName } from "@/src/lib/format";
import { LangToggle, ThemeToggle } from "@/src/components/ui/Preferences";
import AssistantWidget from "./AssistantWidget";
import WorkspaceProvider, { useWorkspace } from "./WorkspaceProvider";

type Role = "customer" | "surveyor" | "admin";

type NavItem = { label: string; href: string; icon: IconName; badge?: "messages" };

const NAV: Record<Role, NavItem[]> = {
  customer: [
    { label: "Dashboard", href: "/customer", icon: "grid" },
    { label: "Pesanan saya", href: "/customer/orders", icon: "clipboard" },
    { label: "Pesan", href: "/customer/messages", icon: "chat", badge: "messages" },
    { label: "Saldo saya", href: "/customer/wallet", icon: "wallet" },
  ],
  surveyor: [
    { label: "Dashboard", href: "/surveyor", icon: "grid" },
    { label: "Order tersedia", href: "/surveyor/open-orders", icon: "pin" },
    { label: "Order survei", href: "/surveyor/orders", icon: "clipboard" },
    { label: "Pesan", href: "/surveyor/messages", icon: "chat", badge: "messages" },
    { label: "Penghasilan", href: "/surveyor/earnings", icon: "wallet" },
  ],
  admin: [
    { label: "Ringkasan", href: "/admin", icon: "grid" },
    { label: "Verifikasi surveyor", href: "/admin/surveyors", icon: "shield" },
    { label: "Penarikan dana", href: "/admin/withdrawals", icon: "wallet" },
  ],
};

/** Judul breadcrumb berdasarkan URL. */
function crumbFor(pathname: string, role: Role) {
  const base = `/${role}`;
  const rest = pathname.slice(base.length);
  if (rest === "" || rest === "/") return "Dashboard";
  if (rest.startsWith("/orders/new")) return "Pesanan baru";
  if (rest.startsWith("/payment") || rest.endsWith("/payment")) return "Pembayaran";
  if (rest.startsWith("/orders")) return role === "customer" ? "Pesanan saya" : "Order survei";
  if (rest.startsWith("/reports")) return "Pesanan saya";
  if (rest.startsWith("/messages")) return "Pesan";
  if (rest.startsWith("/wallet")) return "Saldo saya";
  if (rest.startsWith("/settings")) return "Pengaturan akun";
  if (rest.startsWith("/open-orders")) return "Order tersedia";
  if (rest.startsWith("/earnings")) return "Penghasilan";
  if (rest.startsWith("/surveyors")) return "Verifikasi surveyor";
  if (rest.startsWith("/withdrawals")) return "Penarikan dana";
  return "Workspace";
}

function isActive(pathname: string, href: string, role: Role) {
  if (href === `/${role}`) return pathname === href;
  if (href === "/customer/orders") {
    return pathname.startsWith(href) || pathname.startsWith("/customer/reports");
  }
  return pathname.startsWith(href);
}

function Sidebar({
  open,
  onNavigate,
  onHelp,
}: {
  open: boolean;
  onNavigate: () => void;
  onHelp: () => void;
}) {
  const { role, user, unreadMessages } = useWorkspace();
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Navigasi utama">
      <Link href={`/${role}`} className="sidebar-logo" onClick={onNavigate}>
        <Logo size={40} className="on-dark" />
      </Link>

      <Link href={role === "admin" ? "/admin" : `/${role}/settings`} className="account-card" onClick={onNavigate}>
        <span className="avatar lime">{initials(user?.fullname)}</span>
        <span style={{ minWidth: 0 }}>
          <strong data-no-translate>{user?.fullname ?? "Memuat…"}</strong>
          <small>{role === "customer" ? "Akun pengguna" : role === "admin" ? "Super admin" : "Akun surveyor"}</small>
        </span>
        <Icon name="chevronsUpDown" size={14} className="chev" />
      </Link>

      <p className="nav-label">Workspace</p>
      <nav className="nav">
        {NAV[role].map((item) => {
          const active = isActive(pathname, item.href, role);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.badge === "messages" && unreadMessages > 0 && (
                <span className="nav-badge" aria-label={`${unreadMessages} pesan belum dibaca`}>
                  {unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {role !== "admin" && (
        <div className="help-card">
          <Icon name="bot" size={20} />
          <strong>Ada yang bisa dibantu?</strong>
          <p>Tanya Asisten CKIN soal {role === "customer" ? "pesanan, saldo, dan laporan" : "order dan penghasilan"}-mu.</p>
          <button type="button" onClick={onHelp}>
            Tanya asisten <Icon name="arrowUpRight" size={13} />
          </button>
        </div>
      )}

      {role !== "admin" && (
        <Link
          href={`/${role}/settings`}
          className={`sidebar-settings ${pathname.startsWith(`/${role}/settings`) ? "active" : ""}`}
          onClick={onNavigate}
        >
          <Icon name="settings" size={17} /> Pengaturan akun
        </Link>
      )}
      <p className="sidebar-copy">© 2026 CKIN</p>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { role, user, logout } = useWorkspace();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="topbar">
      <div className="crumbs">
        <button type="button" className="icon-btn menu-toggle" onClick={onMenu} aria-label="Buka menu">
          <Icon name="menu" size={20} />
        </button>
        <Link href={`/${role}`}>Workspace</Link>
        <span>/</span>
        <strong>{crumbFor(pathname, role)}</strong>
      </div>

      <div className="topbar-actions">
        <LangToggle />
        <ThemeToggle />
        <span className="topbar-divider" />
        <div className="profile" ref={menuRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className="avatar">{initials(user?.fullname)}</span>
            <span className="profile-name" data-no-translate>
              {shortName(user?.fullname)}
            </span>
            <Icon name="chevronDown" size={16} />
          </button>

          {open && (
            <div className="profile-menu" role="menu">
              <div className="who">
                <strong>{user?.fullname}</strong>
                <span>{user?.email}</span>
              </div>
              {role !== "admin" && (
                <Link href={`/${role}/settings`} role="menuitem" onClick={() => setOpen(false)}>
                  <Icon name="user" size={16} /> Profil & pengaturan
                </Link>
              )}
              <button type="button" role="menuitem" className="danger" onClick={logout}>
                <Icon name="logout" size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { role, user } = useWorkspace();
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      <Sidebar
        open={menuOpen}
        onNavigate={() => setMenuOpen(false)}
        onHelp={() => {
          setMenuOpen(false);
          setAssistantOpen(true);
        }}
      />
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
      <div className="app-main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="page">{children}</main>
        <footer className="app-footer">
          <span>CKIN — cek dulu, baru pindah.</span>
          <nav aria-label="Tautan informasi">
            <a href="mailto:bantuan@ckin.id">Pusat bantuan</a>
            <span>·</span>
            <Link href={role === "surveyor" ? "/syarat-ketentuan/surveyor" : "/syarat-ketentuan"}>Syarat &amp; ketentuan</Link>
            <span>·</span>
            <Link href="/kebijakan-privasi">Privasi</Link>
          </nav>
        </footer>
      </div>
      {role !== "admin" && (
        <AssistantWidget
          hideFab={pathname.includes("/messages")}
          role={role}
          open={assistantOpen}
          onOpenChange={setAssistantOpen}
          userName={user?.fullname ?? ""}
        />
      )}
    </div>
  );
}

export default function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <WorkspaceProvider role={role}>
      <ShellFrame>{children}</ShellFrame>
    </WorkspaceProvider>
  );
}
