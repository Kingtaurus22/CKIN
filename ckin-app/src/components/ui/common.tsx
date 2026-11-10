import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import Icon from "./Icon";
import type { StatusTone } from "@/src/lib/order-status";

export function StatusPill({ tone, children }: { tone: StatusTone | "lime"; children: ReactNode }) {
  return <span className={`pill tone-${tone}`}>{children}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {subtitle && <p className="sub">{subtitle}</p>}
      </div>
      {actions}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && (
        <Link className="btn btn-primary btn-sm" href={action.href}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Skeleton({ height = 16, width = "100%", style }: { height?: number; width?: number | string; style?: CSSProperties }) {
  return <div className="skeleton" style={{ height, width, ...style }} aria-hidden="true" />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-danger" role="alert">
      <Icon name="alert" size={18} />
      <div>
        <strong>Data belum bisa dimuat</strong>
        {message}
        {onRetry && (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
              <Icon name="refresh" size={14} /> Coba lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  cancelLabel = "Kembali",
  loading,
  error,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
  /** Isian tambahan (mis. alasan penolakan). */
  children?: ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={loading ? undefined : onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-icon">
          <Icon name="alert" size={20} />
        </div>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        {children}
        {error && (
          <p className="field-error" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

/** Penanda halaman yang dikerjakan anggota tim lain (titik integrasi). */
export function ComingSoon({
  owner,
  title,
  description,
  action,
}: {
  owner: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="coming-soon">
      <span className="tag">{owner}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action && (
        <Link className="btn btn-secondary btn-sm" href={action.href} style={{ marginTop: 18 }}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
