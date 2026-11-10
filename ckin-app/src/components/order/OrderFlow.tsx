"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Icon from "@/src/components/ui/Icon";
import { PageHeader } from "@/src/components/ui/common";
import { formatRupiah, regionLabel, shortCity } from "@/src/lib/format";
import { PRICE_PER_KOS, SERVICE_FEE, orderTotal } from "@/src/lib/pricing";
import type { OrderDraft } from "./draft";

const STEPS = ["Lokasi & surveyor", "Pilihan kos", "Jadwal survei", "Konfirmasi"];

export function OrderSteps({ current }: { current: number }) {
  return (
    <ol className="stepper" aria-label="Langkah pesanan">
      {STEPS.map((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "";
        return (
          <li key={label} className={state} aria-current={index === current ? "step" : undefined}>
            <span className="dot">
              {index < current ? <Icon name="check" size={13} strokeWidth={2.2} /> : String(index + 1).padStart(2, "0")}
            </span>
            <span style={{ whiteSpace: "nowrap" }}>{label}</span>
            <span className="line" />
          </li>
        );
      })}
    </ol>
  );
}

export function OrderPage({
  eyebrow,
  title,
  subtitle,
  step,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  step: number;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <OrderSteps current={step} />
      {children}
    </>
  );
}

export function locationLabel(draft: OrderDraft | null) {
  const loc = draft?.surveyLocation;
  if (!loc) return { title: "Lokasi survei", sub: "" };
  return { title: `${regionLabel(loc.district)}, ${shortCity(loc.city)}`, sub: regionLabel(loc.province) };
}

export function OrderSummaryCard({
  draft,
  action,
  note = "Belum ada pembayaran pada tahap ini.",
  showSource = true,
  extra,
}: {
  draft: OrderDraft | null;
  action?: ReactNode;
  note?: string;
  showSource?: boolean;
  extra?: ReactNode;
}) {
  const count = draft?.kosCount ?? 1;
  const loc = locationLabel(draft);
  return (
    <section className="card">
      <h2 className="card-title" style={{ marginBottom: 20 }}>
        Ringkasan pesanan
      </h2>
      <div className="summary-loc">
        <span className="ic">
          <Icon name="pin" size={17} />
        </span>
        <div>
          <strong>{loc.title}</strong>
          <small>{loc.sub}</small>
        </div>
      </div>
      {draft?.surveyorCount !== undefined && (
        <div className="pay-row">
          <span>Surveyor aktif</span>
          <strong style={{ fontWeight: 400 }}>{draft.surveyorCount} di area ini</strong>
        </div>
      )}
      <div className="pay-row">
        <span>Jumlah kos</span>
        <strong style={{ fontWeight: 400 }}>{count} kos</strong>
      </div>
      {showSource && draft?.serviceType && (
        <div className="pay-row">
          <span>Sumber kos</span>
          <strong style={{ fontWeight: 400 }}>
            {draft.serviceType === "USER_CHOICE" ? "Pilihan sendiri" : "Rekomendasi surveyor"}
          </strong>
        </div>
      )}
      <div className="pay-row">
        <span>Biaya per kos</span>
        <strong style={{ fontWeight: 400 }}>{formatRupiah(PRICE_PER_KOS)}</strong>
      </div>
      <div className="summary-sep" />
      <div className="pay-row">
        <span>Biaya survei</span>
        <strong style={{ fontWeight: 400 }}>{formatRupiah(count * PRICE_PER_KOS)}</strong>
      </div>
      <div className="pay-row">
        <span>Biaya layanan</span>
        <strong style={{ fontWeight: 400 }}>{formatRupiah(SERVICE_FEE)}</strong>
      </div>
      <div className="pay-total" style={{ borderTop: 0, paddingTop: 0 }}>
        <span>Total pembayaran</span>
        <strong>{formatRupiah(orderTotal(count))}</strong>
      </div>
      {extra}
      {action}
      {note && <p className="center-note">{note}</p>}
    </section>
  );
}

/** Kembalikan ke langkah awal bila draft belum punya data yang dibutuhkan. */
export function useRequireDraft(draft: OrderDraft | null, needs: Array<keyof OrderDraft>) {
  const router = useRouter();
  useEffect(() => {
    if (!draft) return;
    if (needs.some((key) => draft[key] === undefined)) router.replace("/customer/orders/new");
  }, [draft, needs, router]);
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="btn btn-secondary" href={href}>
      <Icon name="arrowLeft" size={16} /> {children}
    </Link>
  );
}
