"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/src/components/ui/Icon";
import { formatRupiah } from "@/src/lib/format";
import { saveDraft, useDraft } from "./draft";
import { BackLink, OrderPage, OrderSummaryCard, useRequireDraft } from "./OrderFlow";

const FACILITIES = [
  "Kamar mandi dalam",
  "AC",
  "Wi-Fi",
  "Tempat tidur & lemari",
  "Parkir motor",
  "Dapur bersama",
  "Laundry",
  "Akses 24 jam",
  "Jendela / ventilasi",
  "Listrik termasuk",
  "Keamanan / CCTV",
  "Boleh hewan peliharaan",
];

const GENDERS = [
  { value: "FEMALE" as const, label: "Kos putri" },
  { value: "MALE" as const, label: "Kos putra" },
  { value: "ANY" as const, label: "Kos campur" },
];

/** Hanya angka → number. "Rp 1.000.000" → 1000000 */
function parseRupiah(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

/** Langkah 2b — preferensi untuk layanan rekomendasi surveyor. */
export default function PreferenceStep() {
  const router = useRouter();
  const draft = useDraft();
  useRequireDraft(draft, ["surveyLocation", "kosCount"]);
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "ANY">("FEMALE");
  const [min, setMin] = useState(1000000);
  const [max, setMax] = useState(1800000);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const req = draft?.requirements;
    if (!req || draft?.serviceType !== "SURVEYOR_RECOMMENDATION") return;
    if (req.genderPreferences) setGender(req.genderPreferences);
    if (req.budget) {
      setMin(req.budget.min);
      setMax(req.budget.max);
    }
    setFacilities(req.facilities ?? []);
    // Draf lama yang masih punya patokan digabung ke kebutuhan khusus.
    setNotes([req.landmark ? `Patokan: ${req.landmark}` : "", req.notes ?? ""].filter(Boolean).join("\n"));
  }, [draft]);

  function next() {
    if (max <= 0) return setError("Isi budget maksimum per bulan.");
    if (min > max) return setError("Budget minimum tidak boleh melebihi budget maksimum.");
    saveDraft({
      serviceType: "SURVEYOR_RECOMMENDATION",
      requirements: { genderPreferences: gender, budget: { min, max }, facilities, landmark: "", notes },
      targets: [],
    });
    router.push("/customer/orders/new/jadwal");
  }

  return (
    <OrderPage
      eyebrow="Rekomendasi surveyor"
      title="Kos seperti apa yang kamu cari?"
      subtitle={`Bantu surveyor merekomendasikan ${draft?.kosCount ?? ""} kos yang sesuai dengan keseharianmu.`}
      step={1}
    >
      <div className="two-col">
        <div className="stack">
          <section className="card">
            <h2 className="card-title">Kebutuhan utama</h2>
            <p className="card-sub" style={{ marginBottom: 20 }}>
              Preferensi ini menjadi panduan surveyor saat mencari kos.
            </p>
            <p className="label" style={{ marginBottom: 10 }}>
              Tipe kos
            </p>
            <div className="radio-row" role="radiogroup" aria-label="Tipe kos">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  role="radio"
                  aria-checked={gender === g.value}
                  className={`radio-opt ${gender === g.value ? "selected" : ""}`}
                  onClick={() => setGender(g.value)}
                >
                  <span className="radio" /> {g.label}
                </button>
              ))}
            </div>
            <div className="form-grid" style={{ marginTop: 18 }}>
              <div className="field">
                <label className="label" htmlFor="b-min">
                  Budget minimum / bulan
                </label>
                <input
                  id="b-min"
                  className="input"
                  inputMode="numeric"
                  value={formatRupiah(min)}
                  onChange={(e) => setMin(parseRupiah(e.target.value))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="b-max">
                  Budget maksimum / bulan
                </label>
                <input
                  id="b-max"
                  className="input"
                  inputMode="numeric"
                  value={formatRupiah(max)}
                  onChange={(e) => setMax(parseRupiah(e.target.value))}
                />
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Fasilitas yang diinginkan</h2>
            <p className="card-sub" style={{ marginBottom: 20 }}>
              Pilih yang paling penting. Surveyor akan mengonfirmasi ketersediaannya.
            </p>
            <div className="check-grid">
              {FACILITIES.map((facility) => (
                <label key={facility} className="check">
                  <input
                    type="checkbox"
                    checked={facilities.includes(facility)}
                    onChange={() =>
                      setFacilities((list) =>
                        list.includes(facility) ? list.filter((f) => f !== facility) : [...list, facility],
                      )
                    }
                  />
                  {facility}
                </label>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>
              Kebutuhan khusus
            </h2>
            <label className="label" htmlFor="pref-notes" style={{ display: "block", marginBottom: 8 }}>
              Patokan lokasi, tujuan harian, atau hal lain yang perlu dicek surveyor
            </label>
            <textarea
              id="pref-notes"
              className="textarea"
              maxLength={500}
              value={notes}
              placeholder="Contoh: dekat kampus UGM (maks. 15 menit berkendara), lingkungan tenang, sinyal stabil, cek tekanan air…"
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="hint" style={{ marginTop: 8 }}>
              {notes.length} / 500 karakter · Catatan akan dibaca langsung oleh surveyor.
            </p>
          </section>

          {error && (
            <div className="alert alert-danger" role="alert">
              <Icon name="alert" size={17} />
              <span>{error}</span>
            </div>
          )}
          <div>
            <BackLink href="/customer/orders/new/sumber-kos">Kembali ke pilihan kos</BackLink>
          </div>
        </div>

        <aside className="stack">
          <OrderSummaryCard
            draft={draft}
            action={
              <button type="button" className="btn btn-primary btn-block" onClick={next}>
                <Icon name="arrowRight" size={16} /> Lanjut pilih jadwal
              </button>
            }
          />
          <div className="alert alert-info">
            <Icon name="info" size={18} />
            <div>
              <strong style={{ fontWeight: 500 }}>Tidak harus pas semuanya.</strong>
              Surveyor akan memberi alternatif terbaik dan menjelaskan jika ada fasilitas di luar
              anggaranmu.
            </div>
          </div>
        </aside>
      </div>
    </OrderPage>
  );
}
