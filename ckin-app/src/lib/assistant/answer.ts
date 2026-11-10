import { HOLD_DAYS, MAX_ACTIVE_ORDERS, MIN_WITHDRAWAL } from "@/src/lib/survey";
import type { CanonicalStatus } from "@/src/lib/order-status";
import {
  MAX_KOS,
  PAYMENT_WINDOW_HOURS,
  PRICE_PER_KOS,
  SERVICE_FEE,
  TOPUP_ADMIN_FEE,
  TOPUP_MAX,
  TOPUP_MIN,
} from "@/src/lib/pricing";

/**
 * Otak chatbot Asisten CKIN.
 *
 * Masalah versi sebelumnya: jawaban hanya menempelkan potongan dokumen teratas
 * sehingga sering tidak menjawab pertanyaan. Sekarang:
 * 1. Pertanyaan diklasifikasikan ke INTENT yang jelas (status pesanan, saldo, refund, …).
 * 2. Jawaban disusun dari DATA TERSTRUKTUR milik pengguna (bukan teks bebas),
 *    jadi angka, kode pesanan, dan status selalu akurat.
 * 3. Pertanyaan di luar topik CKIN ditolak dengan sopan (batasan topik).
 */

export type Lang = "id" | "en";

export type CustomerFacts = {
  name: string;
  balance: number;
  transactions: Array<{
    description: string;
    amount: number;
    type: "in" | "out";
    status: "SUCCESS" | "PENDING" | "FAILED";
    reference: string | null;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    code: string;
    status: CanonicalStatus;
    statusLabel: string;
    location: string;
    kosCount: number;
    total: number;
    payment: string;
    surveyDate: string | null;
    expiresAt: string | null;
    surveyor: string | null;
    refunded: boolean;
    createdAt: string;
  }>;
};

export type SurveyorFacts = {
  name: string;
  verification: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  acceptingOrders: boolean;
  coverage: string[];
  openCount: number;
  orders: Array<{
    id: string;
    code: string;
    status: CanonicalStatus;
    statusLabel: string;
    customer: string;
    location: string;
    kosCount: number;
    surveyDate: string | null;
    earning: number;
  }>;
  earnings: {
    monthIncome: number;
    available: number;
    held: number;
    heldKos: number;
    withdrawals: Array<{ code: string; amount: number; status: "PENDING" | "SUCCESS" | "REJECTED"; note: string | null }>;
  };
};

export type Intent =
  | "greeting"
  | "thanks"
  | "order_code"
  | "order_status"
  | "order_list"
  | "balance"
  | "transactions"
  | "topup"
  | "refund_cancel"
  | "payment"
  | "price"
  | "schedule"
  | "report_review"
  | "chat"
  | "how_order"
  | "about"
  | "human"
  | "sv_rules"
  | "sv_orders"
  | "sv_open"
  | "sv_earnings"
  | "sv_held"
  | "sv_withdraw"
  | "sv_verify"
  | "sv_report"
  | "out_of_scope";

export type Answer = { intent: Intent; text: string; links: Array<{ title: string; href: string }> };

const rp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
const date = (iso: string | null, lang: Lang) =>
  iso
    ? new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      })
    : "-";
const L = (lang: Lang, id: string, en: string) => (lang === "en" ? en : id);

const STATUS_EN: Record<CanonicalStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  WAITING_SURVEYOR: "Waiting for surveyor",
  ASSIGNED: "Surveyor assigned",
  IN_PROGRESS: "Survey in progress",
  REPORT_SUBMITTED: "Report ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

// ---------------------------------------------------------------------------
// Klasifikasi intent (kata kunci ID + EN, berbobot)
// ---------------------------------------------------------------------------

const RULES: Array<{ intent: Intent; role?: "customer" | "surveyor"; words: RegExp; weight?: number }> = [
  { intent: "greeting", words: /^(halo|hai|hi|hello|hey|pagi|siang|sore|malam|selamat (pagi|siang|sore|malam)|assalamualaikum|permisi)\b[\s!.,?]*$/ , weight: 5 },
  { intent: "thanks", words: /\b(makasih|terima ?kasih|trims|thanks?|thank you|thx|ok(e|ay)? (makasih|thanks))\b/, weight: 4 },
  { intent: "human", words: /\b(admin|cs|customer service|manusia|orang asli|komplain|keluhan|lapor|complain|human|agent)\b/ },
  { intent: "refund_cancel", role: "customer", words: /\b(batal\w*|cancel\w*|refund\w*|pengembalian|uang kembali|dikembalikan|money back)\b/, weight: 3 },
  { intent: "topup", role: "customer", words: /\b(top ?up|isi saldo|tambah saldo|biaya admin|admin fee|deposit)\b/, weight: 3 },
  { intent: "transactions", role: "customer", words: /\b(riwayat|transaksi|history|mutasi|transactions?)\b/, weight: 2 },
  { intent: "balance", role: "customer", words: /\b(saldo|balance|wallet|dompet)\b/, weight: 2 },
  { intent: "payment", role: "customer", words: /\b(bayar|pembayaran|payment|pay|midtrans|virtual account|va|qris|gopay|shopeepay|lunas|kedaluwarsa|expired?|batas bayar)\b/, weight: 2 },
  { intent: "price", words: /\b(harga|biaya|tarif|ongkos|price|cost|fee|berapa (duit|uang)|mahal)\b/, weight: 1.5 },
  { intent: "schedule", role: "customer", words: /\b(jadwal|tanggal|jam|kapan|reschedule|ubah jadwal|schedule|date|time|when)\b/, weight: 1 },
  { intent: "report_review", role: "customer", words: /\b(laporan|report|ulasan|review|rating|bintang|foto|video|hasil survei)\b/, weight: 2 },
  { intent: "chat", words: /\b(chat|hubungi surveyor|kontak surveyor|pesan ke surveyor|message the surveyor|contact the surveyor)\b/, weight: 2 },
  { intent: "how_order", role: "customer", words: /\b(cara (pesan|order|membuat|buat)|buat pesanan|pesan survei|how (to|do i) (order|book)|new order|mulai survei)\b/, weight: 3 },
  { intent: "about", words: /\b(apa itu ckin|ckin itu|tentang ckin|what is ckin|about ckin|booking|book kos|sewa kos)\b/, weight: 3 },
  { intent: "order_list", role: "customer", words: /\b(semua pesanan|daftar pesanan|berapa pesanan|jumlah pesanan|all (my )?orders|how many orders|list)\b/, weight: 3 },
  { intent: "order_status", role: "customer", words: /\b(pesanan|order|status|progres|progress|surveyor saya|sudah sampai mana|terakhir|terbaru|latest|last|aktif|active)\b/, weight: 1 },
  // Surveyor
  { intent: "sv_rules", role: "surveyor", words: /\b(aturan|syarat|maks\w*|batas|kuota|quota|limit|tanggal (sama|yang sama)|same date|ambil order|take (an )?order|rules?)\b/, weight: 2 },
  { intent: "sv_held", role: "surveyor", words: /\b(tertahan|held|hold|ditahan)\b/, weight: 4 },
  { intent: "sv_withdraw", role: "surveyor", words: /\b(tarik|withdraw\w*|cair\w*|pencairan|rekening|bank|transfer)\b/, weight: 3 },
  { intent: "sv_earnings", role: "surveyor", words: /\b(penghasilan|pendapatan|earn\w*|income|gaji|saldo|balance|dapat berapa)\b/, weight: 2 },
  { intent: "sv_verify", role: "surveyor", words: /\b(verifikasi|verified|verification|disetujui|approve\w*|ditolak|rejected|akun saya)\b/, weight: 3 },
  { intent: "sv_report", role: "surveyor", words: /\b(laporan|report|checklist|foto|video|upload|unggah|draf|draft)\b/, weight: 2 },
  { intent: "sv_open", role: "surveyor", words: /\b(order tersedia|available orders?|order baru|new orders?|cari order|open orders?)\b/, weight: 3 },
  { intent: "sv_orders", role: "surveyor", words: /\b(order|pesanan|survei|survey|jadwal|schedule|berjalan|ongoing|aktif|active)\b/, weight: 1 },
];

const CODE_RE = /\b([a-z]{2,4}-\d{4,})\b/i;

export function detectIntent(question: string, role: "customer" | "surveyor"): { intent: Intent; code: string | null } {
  const q = question.toLowerCase().replace(/\s+/g, " ").trim();
  const code = q.match(CODE_RE)?.[1]?.toUpperCase() ?? null;
  if (code) return { intent: role === "customer" ? "order_code" : "sv_orders", code };

  let best: Intent = "out_of_scope";
  let bestScore = 0;
  for (const rule of RULES) {
    if (rule.role && rule.role !== role) continue;
    const matches = q.match(new RegExp(rule.words.source, "g"));
    if (!matches) continue;
    const score = matches.length * (rule.weight ?? 1);
    if (score > bestScore) {
      best = rule.intent;
      bestScore = score;
    }
  }
  return { intent: best, code: null };
}

// ---------------------------------------------------------------------------
// Penyusun jawaban
// ---------------------------------------------------------------------------

function statusText(o: CustomerFacts["orders"][number], lang: Lang) {
  return lang === "en" ? STATUS_EN[o.status] : o.statusLabel;
}

function nextStep(o: CustomerFacts["orders"][number], lang: Lang) {
  switch (o.status) {
    case "PENDING_PAYMENT":
      return L(
        lang,
        `Selesaikan pembayaran sebelum ${date(o.expiresAt, lang)} di halaman detail pesanan, atau batalkan bila tidak jadi.`,
        `Complete the payment before ${date(o.expiresAt, lang)} on the order page, or cancel it if you changed your mind.`,
      );
    case "WAITING_SURVEYOR":
      return L(
        lang,
        "Pesanan sudah dibayar dan sedang menunggu surveyor di area tersebut mengambilnya. Masih bisa dibatalkan dengan refund penuh ke Saldo CKIN.",
        "It's paid and waiting for a surveyor in that area to take it. You can still cancel it for a full refund to your CKIN balance.",
      );
    case "ASSIGNED":
    case "IN_PROGRESS":
      return L(
        lang,
        `Surveyor ${o.surveyor ?? ""} akan/ sedang mengecek kos pada ${date(o.surveyDate, lang)}. Atur jam kunjungan lewat chat.`,
        `Surveyor ${o.surveyor ?? ""} will check / is checking the kos on ${date(o.surveyDate, lang)}. Arrange the visit time via chat.`,
      );
    case "REPORT_SUBMITTED":
      return L(lang, "Laporan sudah masuk — buka laporannya lalu beri ulasan untuk surveyor.", "The report is in — open it and leave a review for the surveyor.");
    case "COMPLETED":
      return L(lang, "Pesanan ini sudah selesai.", "This order is completed.");
    default:
      return o.refunded
        ? L(lang, "Pembayarannya sudah dikembalikan ke Saldo CKIN.", "The payment was refunded to your CKIN balance.")
        : L(lang, "Pesanan ini sudah berhenti.", "This order has stopped.");
  }
}

function describeOrder(o: CustomerFacts["orders"][number], lang: Lang) {
  return L(
    lang,
    `Pesanan #${o.code} (${o.location}, ${o.kosCount} kos) berstatus **${statusText(o, lang)}**. Pembayaran: ${o.payment}, total ${rp(o.total)}. Tanggal survei ${date(o.surveyDate, lang)}.${o.surveyor ? ` Surveyor: ${o.surveyor}.` : ""}\n${nextStep(o, lang)}`,
    `Order #${o.code} (${o.location}, ${o.kosCount} kos) is **${statusText(o, lang)}**. Total ${rp(o.total)}. Survey date ${date(o.surveyDate, lang)}.${o.surveyor ? ` Surveyor: ${o.surveyor}.` : ""}\n${nextStep(o, lang)}`,
  );
}

const ACTIVE: CanonicalStatus[] = ["PENDING_PAYMENT", "WAITING_SURVEYOR", "ASSIGNED", "IN_PROGRESS", "REPORT_SUBMITTED"];

export function scopeMessage(lang: Lang, role: "customer" | "surveyor") {
  return L(
    lang,
    `Maaf, saya hanya bisa membantu pertanyaan seputar CKIN, misalnya ${role === "customer" ? "status pesanan, pembayaran, saldo & top up, pembatalan/refund, jadwal, dan laporan survei" : "aturan ambil order, order berjalan, laporan, penghasilan, dana tertahan, dan tarik dana"}. Coba tanyakan salah satunya, atau sebutkan nomor pesanan (mis. SGH-261102).`,
    `Sorry, I can only help with CKIN topics, such as ${role === "customer" ? "order status, payment, balance & top-ups, cancellation/refunds, schedules, and survey reports" : "order-taking rules, ongoing orders, reports, earnings, held funds, and withdrawals"}. Try one of those, or mention an order number (e.g. SGH-261102).`,
  );
}

export function answerCustomer(question: string, facts: CustomerFacts, lang: Lang): Answer {
  const { intent, code } = detectIntent(question, "customer");
  const links: Answer["links"] = [];
  const orders = facts.orders;
  const latest = orders[0];
  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const first = facts.name.split(" ")[0] || "";

  const say = (text: string) => ({ intent, text, links });

  switch (intent) {
    case "greeting":
      return say(
        L(
          lang,
          `Halo${first ? `, ${first}` : ""}! Ada yang bisa saya bantu soal pesanan, pembayaran, atau saldomu?`,
          `Hi${first ? `, ${first}` : ""}! How can I help with your orders, payments, or balance?`,
        ),
      );
    case "thanks":
      return say(L(lang, "Sama-sama! Kalau ada pertanyaan lain soal CKIN, tanyakan saja.", "You're welcome! Ask me anything else about CKIN."));
    case "order_code": {
      const o = orders.find((x) => x.code.toUpperCase() === code);
      if (!o) {
        return say(
          L(
            lang,
            `Saya tidak menemukan pesanan #${code} di akunmu. Pastikan nomornya benar — saya hanya bisa melihat pesanan milikmu sendiri.`,
            `I couldn't find order #${code} in your account. Please check the number — I can only see your own orders.`,
          ),
        );
      }
      links.push({ title: `#${o.code}`, href: `/customer/orders/${o.id}` });
      if (o.status === "REPORT_SUBMITTED" || o.status === "COMPLETED") links.push({ title: L(lang, "Laporan", "Report"), href: `/customer/reports/${o.id}` });
      return say(describeOrder(o, lang));
    }
    case "order_status": {
      if (!latest) {
        links.push({ title: L(lang, "Buat pesanan", "New order"), href: "/customer/orders/new" });
        return say(L(lang, "Kamu belum punya pesanan. Mulai survei kos pertamamu dari tombol “Buat pesanan”.", "You don't have any orders yet. Start your first kos survey with “New order”."));
      }
      const target = active[0] ?? latest;
      links.push({ title: `#${target.code}`, href: `/customer/orders/${target.id}` });
      const more =
        active.length > 1
          ? L(lang, `\nKamu juga punya ${active.length - 1} pesanan aktif lain: ${active.slice(1, 4).map((o) => `#${o.code} (${o.statusLabel})`).join(", ")}.`, `\nYou also have ${active.length - 1} other active order(s): ${active.slice(1, 4).map((o) => `#${o.code} (${STATUS_EN[o.status]})`).join(", ")}.`)
          : "";
      return say(describeOrder(target, lang) + more);
    }
    case "order_list": {
      links.push({ title: L(lang, "Pesanan saya", "My orders"), href: "/customer/orders" });
      if (!orders.length) return say(L(lang, "Kamu belum punya pesanan.", "You don't have any orders yet."));
      return say(
        L(lang, `Kamu punya ${orders.length} pesanan (${active.length} aktif). Terbaru:`, `You have ${orders.length} orders (${active.length} active). Latest:`) +
          "\n" +
          orders
            .slice(0, 5)
            .map((o) => `• #${o.code} — ${statusText(o, lang)} — ${o.location}, ${date(o.surveyDate, lang)}`)
            .join("\n"),
      );
    }
    case "balance":
      links.push({ title: L(lang, "Saldo saya", "My balance"), href: "/customer/wallet" });
      return say(
        L(
          lang,
          `Saldo CKIN kamu saat ini **${rp(facts.balance)}**. Saldo bisa dipakai membayar pesanan survei, dan bertambah dari top up atau refund pesanan yang dibatalkan.`,
          `Your CKIN balance is **${rp(facts.balance)}**. You can use it to pay for surveys; it grows from top-ups and refunds of cancelled orders.`,
        ),
      );
    case "transactions":
      links.push({ title: L(lang, "Riwayat transaksi", "Transaction history"), href: "/customer/wallet" });
      if (!facts.transactions.length) return say(L(lang, "Belum ada transaksi di akunmu.", "There are no transactions in your account yet."));
      return say(
        L(lang, "Transaksi terakhirmu:", "Your latest transactions:") +
          "\n" +
          facts.transactions
            .map(
              (t) =>
                `• ${date(t.createdAt, lang)} — ${t.description} ${t.type === "in" ? "+" : "−"}${rp(t.amount)} (${
                  t.status === "SUCCESS" ? L(lang, "berhasil", "successful") : t.status === "PENDING" ? L(lang, "menunggu bayar", "awaiting payment") : L(lang, "gagal", "failed")
                })`,
            )
            .join("\n"),
      );
    case "topup":
      links.push({ title: L(lang, "Top up saldo", "Top up"), href: "/customer/wallet#topup" });
      return say(
        L(
          lang,
          `Top up di menu **Saldo saya** → pilih nominal (${rp(TOPUP_MIN)}–${rp(TOPUP_MAX)}) dan metode (Virtual Account, QRIS, atau e-wallet), lalu bayar lewat Midtrans. Ada biaya admin ${rp(TOPUP_ADMIN_FEE)} per top up di luar nominal, jadi saldo bertambah utuh sesuai nominal setelah pembayaran terkonfirmasi.`,
          `Go to **My balance** → choose an amount (${rp(TOPUP_MIN)}–${rp(TOPUP_MAX)}) and a method (Virtual Account, QRIS, or e-wallet), then pay via Midtrans. There's an admin fee of ${rp(TOPUP_ADMIN_FEE)} per top-up on top of the amount, so your balance increases by the full amount once payment is confirmed.`,
        ),
      );
    case "refund_cancel": {
      const cancellable = orders.filter((o) => o.status === "PENDING_PAYMENT" || o.status === "WAITING_SURVEYOR");
      const refunded = orders.filter((o) => o.refunded);
      let extra = "";
      if (cancellable.length) extra += L(lang, `\nPesanan yang masih bisa dibatalkan: ${cancellable.map((o) => `#${o.code}`).join(", ")}.`, `\nOrders you can still cancel: ${cancellable.map((o) => `#${o.code}`).join(", ")}.`);
      if (refunded.length) extra += L(lang, `\nSudah direfund: ${refunded.map((o) => `#${o.code} (${rp(o.total)})`).join(", ")}.`, `\nAlready refunded: ${refunded.map((o) => `#${o.code} (${rp(o.total)})`).join(", ")}.`);
      if (cancellable[0]) links.push({ title: `#${cancellable[0].code}`, href: `/customer/orders/${cancellable[0].id}` });
      return say(
        L(
          lang,
          "Pesanan bisa dibatalkan selama belum diambil surveyor (status Menunggu pembayaran / Menunggu surveyor) lewat tombol “Batalkan pesanan” di detail pesanan. Kalau sudah dibayar — lewat saldo maupun Midtrans — seluruh pembayaran otomatis dikembalikan ke Saldo CKIN. Setelah surveyor mengambil pesanan, pembatalan tidak bisa dilakukan sendiri.",
          "You can cancel an order until a surveyor takes it (Awaiting payment / Waiting for surveyor) with “Cancel order” on the order page. If it's already paid — by balance or Midtrans — the full amount is refunded to your CKIN balance automatically. Once a surveyor takes it, you can't cancel it yourself.",
        ) + extra,
      );
    }
    case "payment": {
      const unpaid = orders.find((o) => o.status === "PENDING_PAYMENT");
      if (unpaid) links.push({ title: L(lang, `Bayar #${unpaid.code}`, `Pay #${unpaid.code}`), href: `/customer/orders/${unpaid.id}/payment` });
      return say(
        L(
          lang,
          `Pesanan bisa dibayar dengan Saldo CKIN (langsung lunas) atau Midtrans (Virtual Account, QRIS, e-wallet). Batas bayar ${PAYMENT_WINDOW_HOURS} jam sejak pesanan dibuat; lewat dari itu pesanan kedaluwarsa.`,
          `You can pay with your CKIN balance (instant) or Midtrans (Virtual Account, QRIS, e-wallet). The payment window is ${PAYMENT_WINDOW_HOURS} hours after the order is created; after that it expires.`,
        ) +
          (unpaid
            ? L(lang, `\nPesanan #${unpaid.code} belum dibayar (${rp(unpaid.total)}), batasnya ${date(unpaid.expiresAt, lang)}.`, `\nOrder #${unpaid.code} is unpaid (${rp(unpaid.total)}), due ${date(unpaid.expiresAt, lang)}.`)
            : ""),
      );
    }
    case "price":
      return say(
        L(
          lang,
          `Biaya survei ${rp(PRICE_PER_KOS)} per kos + biaya layanan ${rp(SERVICE_FEE)} per pesanan (maks. ${MAX_KOS} kos). Contoh: 2 kos = ${rp(2 * PRICE_PER_KOS + SERVICE_FEE)}, 4 kos = ${rp(4 * PRICE_PER_KOS + SERVICE_FEE)}. Top up saldo dikenai biaya admin ${rp(TOPUP_ADMIN_FEE)}.`,
          `The survey costs ${rp(PRICE_PER_KOS)} per kos + a ${rp(SERVICE_FEE)} service fee per order (max. ${MAX_KOS} kos). E.g. 2 kos = ${rp(2 * PRICE_PER_KOS + SERVICE_FEE)}, 4 kos = ${rp(4 * PRICE_PER_KOS + SERVICE_FEE)}. Balance top-ups have a ${rp(TOPUP_ADMIN_FEE)} admin fee.`,
        ),
      );
    case "schedule": {
      const upcoming = active.filter((o) => o.surveyDate).slice(0, 3);
      return say(
        L(
          lang,
          "Tanggal survei dipilih saat membuat pesanan: paling cepat H+2 dan paling lambat 7 hari sebelum rencana masuk kos. Jam kunjungan tidak dipilih di form — disepakati dengan surveyor lewat chat setelah pesanan diambil.",
          "You pick the survey date when ordering: at least 2 days from now and at least 7 days before move-in. The visit time isn't chosen in the form — agree on it with the surveyor via chat after they take the order.",
        ) +
          (upcoming.length
            ? "\n" + L(lang, "Jadwal survei kamu: ", "Your survey dates: ") + upcoming.map((o) => `#${o.code} ${date(o.surveyDate, lang)}`).join(", ") + "."
            : ""),
      );
    }
    case "report_review": {
      const ready = orders.filter((o) => o.status === "REPORT_SUBMITTED");
      ready.slice(0, 2).forEach((o) => links.push({ title: L(lang, `Laporan #${o.code}`, `Report #${o.code}`), href: `/customer/reports/${o.id}` }));
      return say(
        L(
          lang,
          "Laporan muncul setelah surveyor menyelesaikan kunjungan: berisi foto/video, harga sewa terkonfirmasi, ketersediaan kamar, checklist pemeriksaan, dan catatan. Buka dari detail pesanan → Lihat laporan, lalu beri ulasan untuk surveyor agar pesanan selesai.",
          "The report appears after the surveyor's visit: photos/videos, confirmed rent, room availability, an inspection checklist, and notes. Open it from the order page → See report, then review the surveyor to complete the order.",
        ) +
          (ready.length
            ? L(lang, `\nLaporan yang menunggu ulasanmu: ${ready.map((o) => `#${o.code}`).join(", ")}.`, `\nReports waiting for your review: ${ready.map((o) => `#${o.code}`).join(", ")}.`)
            : ""),
      );
    }
    case "chat":
      links.push({ title: L(lang, "Pesan", "Messages"), href: "/customer/messages" });
      return say(
        L(
          lang,
          "Chat dengan surveyor aktif setelah surveyor mengambil pesananmu. Buka menu **Pesan** atau tombol chat di detail pesanan untuk menyepakati jam kunjungan dan menanyakan detail kos.",
          "Chat with the surveyor opens once they take your order. Use **Messages** or the chat on the order page to agree on a visit time and ask about the kos.",
        ),
      );
    case "how_order":
      links.push({ title: L(lang, "Buat pesanan", "New order"), href: "/customer/orders/new" });
      return say(
        L(
          lang,
          `Caranya: 1) pilih kecamatan & jumlah kos (1–${MAX_KOS}); 2) pilih kos sendiri atau minta rekomendasi surveyor (isi tipe kos, budget, fasilitas, kebutuhan khusus); 3) pilih tanggal survei; 4) tinjau & bayar. Setelah lunas, surveyor di area itu bisa mengambil pesananmu.`,
          `Steps: 1) choose the district & number of kos (1–${MAX_KOS}); 2) pick your own kos or ask for surveyor recommendations (type, budget, facilities, special needs); 3) choose a survey date; 4) review & pay. Once paid, surveyors in that area can take your order.`,
        ),
      );
    case "about":
      return say(
        L(
          lang,
          "CKIN membantu kamu mengecek kos tanpa datang langsung: surveyor lokal mengunjungi kos dan mengirim laporan lengkap. CKIN tidak menyediakan booking/sewa kos — setelah membaca laporan, hubungi pemilik kos secara langsung.",
          "CKIN lets you check a kos without visiting: a local surveyor visits and sends a complete report. CKIN doesn't handle booking/renting — after reading the report, contact the owner directly.",
        ),
      );
    case "human":
      return say(
        L(
          lang,
          "Untuk bantuan langsung dari tim CKIN, kirim email ke bantuan@ckin.id dan sertakan nomor pesanan atau transaksi supaya cepat ditangani.",
          "For direct help from the CKIN team, email bantuan@ckin.id and include your order or transaction number.",
        ),
      );
    default:
      return { intent: "out_of_scope", text: scopeMessage(lang, "customer"), links };
  }
}

export function answerSurveyor(question: string, facts: SurveyorFacts, lang: Lang): Answer {
  const { intent, code } = detectIntent(question, "surveyor");
  const links: Answer["links"] = [];
  const say = (text: string) => ({ intent, text, links });
  const running = facts.orders.filter((o) => o.status === "ASSIGNED" || o.status === "IN_PROGRESS");
  const first = facts.name.split(" ")[0] || "";

  switch (intent) {
    case "greeting":
      return say(L(lang, `Halo${first ? `, ${first}` : ""}! Mau cek order, laporan, atau penghasilanmu?`, `Hi${first ? `, ${first}` : ""}! Want to check your orders, reports, or earnings?`));
    case "thanks":
      return say(L(lang, "Sama-sama, semangat surveinya!", "You're welcome, good luck with the surveys!"));
    case "sv_orders": {
      if (code) {
        const o = facts.orders.find((x) => x.code.toUpperCase() === code);
        if (!o) return say(L(lang, `Order #${code} tidak ada di daftar order yang kamu ambil.`, `Order #${code} isn't among the orders you've taken.`));
        links.push({ title: `#${o.code}`, href: `/surveyor/orders/${o.id}` });
        return say(
          L(
            lang,
            `Order #${o.code} — ${o.customer}, ${o.location}, ${o.kosCount} kos. Status: **${o.statusLabel}**. Tanggal survei ${date(o.surveyDate, lang)}. Pendapatan ${rp(o.earning)}.`,
            `Order #${o.code} — ${o.customer}, ${o.location}, ${o.kosCount} kos. Status: **${STATUS_EN[o.status]}**. Survey date ${date(o.surveyDate, lang)}. Earnings ${rp(o.earning)}.`,
          ),
        );
      }
      links.push({ title: L(lang, "Order survei", "Survey orders"), href: "/surveyor/orders" });
      if (!running.length) return say(L(lang, `Tidak ada order berjalan. Ada ${facts.openCount} order tersedia di areamu.`, `No ongoing orders. There are ${facts.openCount} available orders in your area.`));
      return say(
        L(lang, `Order berjalan (${running.length}/${MAX_ACTIVE_ORDERS}):`, `Ongoing orders (${running.length}/${MAX_ACTIVE_ORDERS}):`) +
          "\n" +
          running.map((o) => `• #${o.code} — ${o.customer}, ${o.location}, ${date(o.surveyDate, lang)} (${lang === "en" ? STATUS_EN[o.status] : o.statusLabel})`).join("\n"),
      );
    }
    case "sv_open":
      links.push({ title: L(lang, "Order tersedia", "Available orders"), href: "/surveyor/open-orders" });
      return say(
        L(
          lang,
          `Ada ${facts.openCount} order terbayar di area jangkauanmu (${facts.coverage.join(", ") || "-"}). Kamu sedang menjalankan ${running.length}/${MAX_ACTIVE_ORDERS} order.`,
          `There are ${facts.openCount} paid orders in your coverage area (${facts.coverage.join(", ") || "-"}). You're running ${running.length}/${MAX_ACTIVE_ORDERS} orders.`,
        ),
      );
    case "sv_rules":
      return say(
        L(
          lang,
          `Aturan ambil order: akun harus terverifikasi dan "Aktif menerima order" menyala; hanya order yang sudah dibayar di kecamatan jangkauanmu; maksimal ${MAX_ACTIVE_ORDERS} order berjalan sekaligus; dan setiap order harus di tanggal survei yang berbeda. Satu order hanya bisa diambil satu surveyor. Saat ini kamu menjalankan ${running.length}/${MAX_ACTIVE_ORDERS}.`,
          `Rules: your account must be verified with "Accepting orders" on; only paid orders in your coverage districts; max ${MAX_ACTIVE_ORDERS} ongoing orders at once; and each must be on a different survey date. One order can only be taken by one surveyor. You're currently running ${running.length}/${MAX_ACTIVE_ORDERS}.`,
        ),
      );
    case "sv_held":
      links.push({ title: L(lang, "Penghasilan", "Earnings"), href: "/surveyor/earnings" });
      return say(
        L(
          lang,
          `Dana tertahan adalah pendapatan dari laporan yang sudah kamu kirim tetapi masih dalam masa review customer. Dana pindah ke saldo dapat ditarik saat customer memberi ulasan, atau otomatis ${HOLD_DAYS} hari setelah laporan dikirim. Saat ini dana tertahanmu ${rp(facts.earnings.held)} (${facts.earnings.heldKos} kos).`,
          `Held funds are earnings from reports you've sent that are still in the customer's review period. They move to your withdrawable balance when the customer reviews, or automatically ${HOLD_DAYS} days after the report. Your held funds now: ${rp(facts.earnings.held)} (${facts.earnings.heldKos} kos).`,
        ),
      );
    case "sv_earnings":
      links.push({ title: L(lang, "Penghasilan", "Earnings"), href: "/surveyor/earnings" });
      return say(
        L(
          lang,
          `Pendapatan bulan ini ${rp(facts.earnings.monthIncome)}. Saldo dapat ditarik **${rp(facts.earnings.available)}**, dana tertahan ${rp(facts.earnings.held)}. Kamu mendapat ${rp(PRICE_PER_KOS)} bersih per kos.`,
          `Earnings this month: ${rp(facts.earnings.monthIncome)}. Withdrawable balance **${rp(facts.earnings.available)}**, held funds ${rp(facts.earnings.held)}. You earn ${rp(PRICE_PER_KOS)} net per kos.`,
        ),
      );
    case "sv_withdraw": {
      links.push({ title: L(lang, "Tarik dana", "Withdraw"), href: "/surveyor/earnings" });
      const last = facts.earnings.withdrawals[0];
      const st = (s: string) => (s === "SUCCESS" ? L(lang, "berhasil", "successful") : s === "PENDING" ? L(lang, "diproses", "processing") : L(lang, "ditolak", "rejected"));
      return say(
        L(
          lang,
          `Tarik dana di halaman Penghasilan: isi rekening & nominal (min. ${rp(MIN_WITHDRAWAL)}, maks. saldo dapat ditarik). Admin CKIN memproses dalam 1–2 hari kerja; hanya satu pengajuan yang bisa diproses sekaligus. Saldo dapat ditarik sekarang ${rp(facts.earnings.available)}.`,
          `Withdraw from the Earnings page: enter your bank account & amount (min. ${rp(MIN_WITHDRAWAL)}, max. your withdrawable balance). CKIN admin processes it within 1–2 business days; one request at a time. Withdrawable now: ${rp(facts.earnings.available)}.`,
        ) +
          (last
            ? L(lang, `\nPengajuan terakhir: #${last.code} ${rp(last.amount)} — ${st(last.status)}${last.note ? ` (${last.note})` : ""}.`, `\nLatest request: #${last.code} ${rp(last.amount)} — ${st(last.status)}${last.note ? ` (${last.note})` : ""}.`)
            : ""),
      );
    }
    case "sv_verify":
      return say(
        facts.verification === "APPROVED"
          ? L(lang, `Akunmu sudah terverifikasi${facts.acceptingOrders ? " dan aktif menerima order" : ", tapi status menerima order sedang mati — nyalakan di Pengaturan akun"}.`, `Your account is verified${facts.acceptingOrders ? " and accepting orders" : ", but accepting orders is off — turn it on in Account settings"}.`)
          : facts.verification === "REJECTED"
            ? L(lang, `Verifikasi akunmu ditolak${facts.rejectionReason ? `: ${facts.rejectionReason}` : ""}. Hubungi bantuan@ckin.id untuk mengajukan ulang.`, `Your verification was rejected${facts.rejectionReason ? `: ${facts.rejectionReason}` : ""}. Contact bantuan@ckin.id to re-apply.`)
            : L(lang, "Akunmu masih menunggu verifikasi admin CKIN (biasanya 1–3 hari kerja). Selama itu kamu bisa melihat order tetapi belum bisa mengambilnya.", "Your account is awaiting CKIN admin verification (usually 1–3 business days). Until then you can view orders but not take them."),
      );
    case "sv_report":
      return say(
        L(
          lang,
          "Di halaman Kelola survei: lengkapi checklist 8 pemeriksaan per kos, unggah minimal 1 foto (JPG/PNG maks. 5 MB; video MP4 maks. 50 MB), isi harga sewa terkonfirmasi, ketersediaan, serta kondisi & lingkungan. Simpan draf kapan saja, lalu kirim setelah semua kos lengkap — laporan terkirim tidak bisa diubah.",
          "On the Manage survey page: complete the 8-point checklist per kos, upload at least 1 photo (JPG/PNG max. 5 MB; MP4 video max. 50 MB), and fill in confirmed rent, availability, and condition & surroundings. Save drafts anytime and send once every kos is complete — sent reports can't be edited.",
        ),
      );
    case "price":
      return say(L(lang, `Kamu mendapat ${rp(PRICE_PER_KOS)} bersih per kos yang disurvei.`, `You earn ${rp(PRICE_PER_KOS)} net per kos surveyed.`));
    case "chat":
      links.push({ title: L(lang, "Pesan", "Messages"), href: "/surveyor/messages" });
      return say(L(lang, "Chat dengan customer tersedia di menu Pesan untuk setiap order yang kamu ambil — gunakan untuk menyepakati jam kunjungan.", "Chat with customers is in Messages for every order you take — use it to agree on the visit time."));
    case "about":
      return say(L(lang, "CKIN menghubungkan pencari kos dengan surveyor lokal yang mengecek kos dan mengirim laporan. CKIN tidak menangani booking/sewa kos.", "CKIN connects kos seekers with local surveyors who check kos and send reports. CKIN doesn't handle booking/renting."));
    case "human":
      return say(L(lang, "Untuk bantuan langsung, email bantuan@ckin.id dengan menyertakan nomor order.", "For direct help, email bantuan@ckin.id with your order number."));
    default:
      return { intent: "out_of_scope", text: scopeMessage(lang, "surveyor"), links };
  }
}
