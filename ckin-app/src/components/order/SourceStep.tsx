"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import type { ServiceType } from "@/src/schemas/order";
import { saveDraft, useDraft } from "./draft";
import { BackLink, OrderPage, OrderSummaryCard, locationLabel, useRequireDraft } from "./OrderFlow";

const NEEDS = ["surveyLocation", "kosCount"] as const;

/** Langkah 2a — rekomendasi surveyor atau kos pilihan sendiri. */
export default function SourceStep() {
  const router = useRouter();
  const draft = useDraft();
  useRequireDraft(draft, [...NEEDS]);
  const [choice, setChoice] = useState<ServiceType>("SURVEYOR_RECOMMENDATION");

  useEffect(() => {
    if (draft?.serviceType) setChoice(draft.serviceType);
  }, [draft]);

  const count = draft?.kosCount ?? 1;
  const loc = locationLabel(draft);

  function next() {
    saveDraft({ serviceType: choice });
    router.push(
      choice === "SURVEYOR_RECOMMENDATION" ? "/customer/orders/new/preferensi" : "/customer/orders/new/kos-pilihan",
    );
  }

  const options = [
    {
      value: "SURVEYOR_RECOMMENDATION" as const,
      icon: "star" as const,
      title: "Minta rekomendasi surveyor",
      text: "Belum menemukan yang cocok? Ceritakan kebutuhanmu, surveyor akan mencarikan kos sesuai preferensi dan anggaran.",
      perks: ["✓ Sesuai budget", "✓ Kenal lingkungan", "✓ Hemat waktu"],
    },
    {
      value: "USER_CHOICE" as const,
      icon: "clipboard" as const,
      title: "Saya sudah punya pilihan kos",
      text: "Kirim nama, alamat, atau tautan kos incaranmu. Surveyor akan datang dan mengecek langsung sesuai daftar yang kamu berikan.",
      perks: [`Siapkan detail untuk ${count} kos di ${loc.title}.`],
    },
  ];

  return (
    <OrderPage
      eyebrow="Pesanan baru"
      title="Sudah punya kos incaran?"
      subtitle={`Tentukan cara mencari ${count} kos yang akan disurvei.`}
      step={1}
    >
      <div className="two-col">
        <div className="stack">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`choice-card ${choice === option.value ? "selected" : ""}`}
              onClick={() => setChoice(option.value)}
              aria-pressed={choice === option.value}
            >
              <span className="top">
                <span className="ic">
                  <Icon name={option.icon} size={20} />
                </span>
                <span className="radio" />
              </span>
              <h2>{option.title}</h2>
              <p>{option.text}</p>
              <span className="perks">
                {option.perks.map((perk) => (
                  <span key={perk}>{perk}</span>
                ))}
              </span>
            </button>
          ))}
          <div className="alert alert-info">
            <Icon name="info" size={18} />
            <div>
              <strong style={{ fontWeight: 500 }}>Dua cara, standar survei yang sama.</strong>
              Kedua pilihan sudah termasuk pengecekan fasilitas, foto dan video asli, serta catatan
              lingkungan kos.
            </div>
          </div>
          <div>
            <BackLink href="/customer/orders/new">Kembali</BackLink>
          </div>
        </div>
        <aside>
          <OrderSummaryCard
            draft={draft ? { ...draft, serviceType: choice } : null}
            action={
              <button type="button" className="btn btn-primary btn-block" onClick={next}>
                <Icon name="arrowRight" size={16} />{" "}
                {choice === "SURVEYOR_RECOMMENDATION" ? "Isi preferensi kos" : "Isi daftar kos"}
              </button>
            }
          />
        </aside>
      </div>
    </OrderPage>
  );
}
