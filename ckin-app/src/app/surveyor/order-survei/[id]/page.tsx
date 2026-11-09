"use client";

import { useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    MapPin,
    ClipboardList,
    MessageSquare,
    Wallet,
    Settings,
    Headset,
    Bell,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Circle,
    Clock3,
    ShieldCheck,
    Wifi,
    Trees,
    DoorOpen,
    UploadCloud,
    Save,
    Send,
    Headphones,
    CloudUpload,
    ImagePlus,
    Menu,
    X,
} from "lucide-react";

const initialKos = [
    {
        id: 1,
        name: "Kos Melati",
        address: "Jl. Kaliurang Km 5, Sindudadi",
        completed: 8,
        total: 8,
    },
    {
        id: 2,
        name: "Kos Seroja",
        address: "Jl. Monjali, Sendangadi",
        completed: 3,
        total: 8,
    },
];

const checklistGroups = [
    {
        title: "Kondisi",
        icon: DoorOpen,
        items: [
            "Dinding & lantai",
            "Ventilasi & cahaya",
            "Air & kamar mandi",
        ],
    },
    {
        title: "Fasilitas",
        icon: Wifi,
        items: [
            "Wi-Fi & sinyal",
            "Listrik & biaya",
            "Parkir & keamanan",
        ],
    },
    {
        title: "Lingkungan",
        icon: Trees,
        items: [
            "Akses jalan",
            "Kebisingan sekitar",
        ],
    },
];

const initialChecked = [
    "Dinding & lantai",
    "Ventilasi & cahaya",
    "Air & kamar mandi",
    "Wi-Fi & sinyal",
    "Listrik & biaya",
    "Parkir & keamanan",
    "Akses jalan",
    "Kebisingan sekitar",
];

const navItems = [
    { label: "Dashboard", href: "/surveyor/dashboard", icon: LayoutDashboard },
    { label: "Order tersedia", href: "/surveyor/order-tersedia", icon: MapPin },
    { label: "Order survei", href: "/surveyor/order-survei", icon: ClipboardList, active: true },
    { label: "Pesan", href: "/surveyor/pesan", icon: MessageSquare, badge: "2" },
    { label: "Penghasilan", href: "/surveyor/penghasilan", icon: Wallet },
];

export default function DetailOrderSurveiPage() {
    const [activeKos, setActiveKos] = useState(1);
    const [checkedItems, setCheckedItems] = useState<string[]>(initialChecked);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [photos, setPhotos] = useState([
        {
            name: "kamar_melati.jpg",
            url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600",
            size: "2,4 MB",
        },
    ]);

    const [hargaSewa, setHargaSewa] = useState("Rp1.250.000 / bulan");
    const [availability, setAvailability] = useState("1 kamar kosong");
    const [condition, setCondition] = useState(
        "Kamar bersih, dinding tidak lembap, dan ventilasi baik. Air mengalir lancar. Wi-Fi termasuk biaya sewa, listrik menggunakan token terpisah. Parkir motor berpagar. Jalan bisa dilewati mobil, suasana cukup tenang pada pagi hari."
    );
    const [notes, setNotes] = useState(
        "Cocok untuk yang mencari kamar terang. Konfirmasi kecepatan Wi-Fi pada malam hari dan biaya deposit Rp500.000 dengan pemilik sebelum memesan."
    );

    const [saved, setSaved] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const totalChecked = checkedItems.length;
    const totalChecklist = 8;
    const progress = Math.round(
        (totalChecked / totalChecklist) * 100
    );

    const selectedKos = initialKos.find(
        (kos) => kos.id === activeKos
    );

    function toggleChecklist(item: string) {
        setCheckedItems((prev) =>
            prev.includes(item)
                ? prev.filter((value) => value !== item)
                : [...prev, item]
        );

        setSaved(false);
    }

    function handlePhotoUpload(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const files = event.target.files;

        if (!files) return;

        const newPhotos = Array.from(files).map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file),
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        }));

        setPhotos((prev) => [...prev, ...newPhotos]);
        setSaved(false);
    }

    function handleSaveDraft() {
        setSaved(true);
        alert("Draft laporan berhasil disimpan secara lokal.");
    }

    function handleSubmit() {
        if (totalChecked < totalChecklist) {
            alert("Silakan selesaikan semua checklist terlebih dahulu.");
            return;
        }

        if (photos.length === 0) {
            alert("Tambahkan minimal satu foto bukti survei.");
            return;
        }

        setSubmitting(true);

        setTimeout(() => {
            setSubmitting(false);
            alert("Simulasi: laporan siap dikirim. Belum terhubung ke backend.");
        }, 500);
    }

    return (
        <div className="min-h-screen bg-[#f4f6f2] text-[#203a36]">

            {/* MOBILE MENU */}
            {mobileMenu && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileMenu(false)}
                    />

                    <aside className="relative h-full w-72 bg-[#103f3a] p-5 text-white">
                        <button
                            onClick={() => setMobileMenu(false)}
                            className="absolute right-4 top-4"
                        >
                            <X size={22} />
                        </button>

                        <div className="mb-8 rounded bg-white p-3 text-center">
                            <span className="text-xl font-bold text-[#145b4b]">
                                CKIN
                            </span>
                            <p className="text-xs text-gray-500">
                                Cari Kost
                            </p>
                        </div>

                        <p className="mb-3 text-xs text-white/50">
                            WORKSPACE
                        </p>

                        {navItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`mb-2 flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${item.active
                                        ? "bg-[#d9ed83] font-semibold text-[#17463d]"
                                        : "text-white/70 hover:bg-white/10"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </aside>
                </div>
            )}

            {/* SIDEBAR */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[162px] flex-col bg-[#103f3a] px-3 py-4 text-white lg:flex">
                <div className="mb-5 flex h-[66px] items-center justify-center bg-white">
                    <div className="text-center">
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#145b4b]">
                            CKIN
                        </h1>
                        <p className="-mt-1 text-[9px] font-semibold text-[#145b4b]">
                            Cari Kost
                        </p>
                    </div>
                </div>

                {/* PROFILE */}
                <button className="mb-5 flex items-center gap-2 rounded-lg bg-white/10 p-2 text-left">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d9ed83] text-[10px] font-bold text-[#17463d]">
                        BW
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold">
                            Bima Wicaksono
                        </p>
                        <p className="text-[9px] text-white/60">
                            Akun surveyor
                        </p>
                    </div>
                    <ChevronDown size={12} />
                </button>

                <p className="mb-2 px-2 text-[9px] font-medium text-white/50">
                    WORKSPACE
                </p>

                <nav className="flex flex-col gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-2 rounded-md px-2 py-2.5 text-[10px] transition ${item.active
                                    ? "bg-[#d9ed83] font-semibold text-[#17463d]"
                                    : "text-white/65 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <Icon size={14} />
                                <span>{item.label}</span>

                                {item.badge && (
                                    <span className="ml-auto text-[9px]">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto">
                    <div className="mb-3 rounded-lg bg-white/10 p-3">
                        <Headset size={17} className="mb-2 text-[#d9ed83]" />
                        <p className="text-[10px] font-semibold">
                            Ada yang bisa dibantu?
                        </p>
                        <p className="mt-2 text-[9px] leading-relaxed text-white/60">
                            Tim CKIN siap menemani perjalanan cari kosmu.
                        </p>
                        <button className="mt-2 text-[9px] font-semibold text-[#d9ed83]">
                            Hubungi bantuan ↗
                        </button>
                    </div>

                    <Link
                        href="/surveyor/pengaturan"
                        className="flex items-center gap-2 px-2 py-2 text-[10px] text-white/60"
                    >
                        <Settings size={14} />
                        Pengaturan akun
                    </Link>

                    <p className="mt-2 px-2 text-[9px] text-white/40">
                        © 2026 CKIN
                    </p>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="min-h-screen lg:ml-[162px]">

                {/* TOPBAR */}
                <header className="sticky top-0 z-20 flex h-[54px] items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-7">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenu(true)}
                            className="lg:hidden"
                        >
                            <Menu size={21} />
                        </button>

                        <div className="text-[11px] text-gray-400">
                            Workspace
                            <span className="mx-2">/</span>
                            <span className="font-medium text-[#203a36]">
                                Order survei
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <span className="hidden sm:block">
                            ID · Bahasa Indonesia
                        </span>
                        <Bell size={17} />
                        <div className="hidden h-7 w-7 items-center justify-center rounded-full bg-[#e7f1ec] text-[9px] font-bold text-[#145b4b] sm:flex">
                            BW
                        </div>
                        <span className="hidden font-semibold text-[#203a36] sm:block">
                            Bima W.
                        </span>
                        <ChevronDown size={13} />
                    </div>
                </header>

                <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-7">

                    {/* BREADCRUMB */}
                    <Link
                        href="/surveyor/order-survei"
                        className="mb-5 inline-flex items-center gap-2 text-[11px] text-[#356b63] hover:text-[#103f3a]"
                    >
                        <ArrowLeft size={15} />
                        Kembali ke order survei
                    </Link>

                    {/* PAGE TITLE */}
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="mb-1 text-[9px] font-semibold tracking-[2px] text-[#43877c]">
                                KELOLA SURVEI · #SGH-261102
                            </p>

                            <h1 className="text-xl font-semibold text-[#203a36] sm:text-2xl">
                                Survei kos di Mlati
                            </h1>

                            <p className="mt-2 text-[11px] text-gray-500 sm:text-xs">
                                Dokumentasikan kondisi sebenarnya agar Alya dapat memilih dengan yakin.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#e6f1ec] px-3 py-1 text-[9px] font-semibold text-[#327568]">
                                ● Dalam proses
                            </span>
                            <span className="rounded-full bg-[#e6f1ec] px-3 py-1 text-[9px] font-semibold text-[#327568]">
                                ● Sudah dibayar
                            </span>
                        </div>
                    </div>

                    {/* ORDER INFORMATION */}
                    <section className="mb-5 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">

                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7f1ec] text-[10px] font-bold text-[#285d54]">
                                AP
                            </div>

                            <div>
                                <h3 className="text-[12px] font-semibold">
                                    Alya Putri
                                </h3>
                                <p className="text-[9px] text-gray-400">
                                    Customer · 2 kos pilihan pengguna
                                </p>
                            </div>

                            <button className="ml-auto rounded-lg border border-gray-200 px-3 py-2 text-[10px] font-semibold hover:bg-gray-50">
                                <MessageSquare size={12} className="mr-1 inline" />
                                Pesan
                            </button>
                        </div>

                        <div className="flex items-center gap-3 border-t border-gray-100 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                            <CalendarDays size={18} className="shrink-0" />
                            <div>
                                <p className="text-[10px] font-medium">
                                    06 Nov 2026 · 09.00–12.00 WIB
                                </p>
                                <p className="text-[9px] text-gray-400">
                                    Mlati, Sleman · DI Yogyakarta
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3 sm:border-0 sm:pt-0 sm:text-right">
                            <p className="text-[9px] text-gray-400">
                                SURVEYOR
                            </p>
                            <p className="text-[10px] font-semibold">
                                Bima Wicaksono
                            </p>
                        </div>
                    </section>

                    {/* CONTENT GRID */}
                    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(270px,0.8fr)]">

                        {/* LEFT COLUMN */}
                        <div className="min-w-0 space-y-4">

                            {/* PROGRESS PER KOS */}
                            <section className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="text-sm font-semibold">
                                    Progres per kos
                                </h2>

                                <p className="mb-4 mt-1 text-[10px] text-gray-400">
                                    {totalChecked} dari {totalChecklist} pemeriksaan selesai · lanjutkan pengecekan berikutnya.
                                </p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {initialKos.map((kos) => (
                                        <button
                                            key={kos.id}
                                            onClick={() => setActiveKos(kos.id)}
                                            className={`rounded-lg border p-3 text-left transition ${activeKos === kos.id
                                                ? "border-[#356b63] bg-[#e8f1ec]"
                                                : "border-gray-200 hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-semibold">
                                                    {kos.name}
                                                </span>

                                                {kos.completed === kos.total ? (
                                                    <CheckCircle2
                                                        size={14}
                                                        className="text-[#34796c]"
                                                    />
                                                ) : (
                                                    <Clock3
                                                        size={14}
                                                        className="text-gray-400"
                                                    />
                                                )}
                                            </div>

                                            <p className="mt-2 text-[9px] text-gray-400">
                                                {kos.address}
                                            </p>

                                            <div className="mt-3 flex justify-between text-[9px] text-[#39776c]">
                                                <span>
                                                    {activeKos === kos.id
                                                        ? `${totalChecked}/${totalChecklist} pemeriksaan selesai`
                                                        : `${kos.completed}/${kos.total} pemeriksaan selesai`}
                                                </span>

                                                <span className="font-semibold">
                                                    {kos.completed === kos.total
                                                        ? "Sedang dibuka"
                                                        : "Lanjutkan →"}
                                                </span>
                                            </div>

                                            <div className="mt-2 h-[3px] rounded-full bg-gray-200">
                                                <div
                                                    className="h-full rounded-full bg-[#28675b]"
                                                    style={{
                                                        width: `${activeKos === kos.id
                                                            ? progress
                                                            : (kos.completed / kos.total) * 100
                                                            }%`,
                                                    }}
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* CHECKLIST */}
                            <section className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="text-sm font-semibold">
                                    Checklist {selectedKos?.name}
                                </h2>

                                <p className="mb-5 mt-1 text-[10px] text-gray-400">
                                    Tandai setiap aspek setelah diperiksa langsung di lokasi.
                                </p>

                                <div className="grid gap-5 sm:grid-cols-3">
                                    {checklistGroups.map((group) => {
                                        const Icon = group.icon;

                                        return (
                                            <div key={group.title}>
                                                <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold">
                                                    <Icon size={14} />
                                                    {group.title}
                                                </h3>

                                                <div className="space-y-3">
                                                    {group.items.map((item) => {
                                                        const checked =
                                                            checkedItems.includes(item);

                                                        return (
                                                            <label
                                                                key={item}
                                                                className="flex cursor-pointer items-center gap-2 text-[10px] text-gray-600"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() =>
                                                                        toggleChecklist(item)
                                                                    }
                                                                    className="h-3 w-3 accent-[#145b4b]"
                                                                />

                                                                <span className={
                                                                    checked
                                                                        ? "text-[#365f58]"
                                                                        : ""
                                                                }>
                                                                    {item}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
                                    <span className="rounded-full bg-[#e6f1ec] px-3 py-1 text-[9px] font-semibold text-[#34796c]">
                                        ● {totalChecked}/{totalChecklist} diperiksa
                                    </span>

                                    <span className="text-[9px] text-gray-400">
                                        Terakhir diperbarui 09.18 WIB
                                    </span>
                                </div>
                            </section>

                            {/* PHOTO EVIDENCE */}
                            <section className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="text-sm font-semibold">
                                    Bukti foto {selectedKos?.name}
                                </h2>

                                <p className="mb-4 mt-1 text-[10px] text-gray-400">
                                    Unggah foto asli yang jelas: kamar, kamar mandi, fasilitas, dan lingkungan.
                                </p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {photos.map((photo, index) => (
                                        <div
                                            key={`${photo.name}-${index}`}
                                            className="overflow-hidden rounded-lg border border-gray-200"
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.name}
                                                className="h-32 w-full object-cover"
                                            />

                                            <div className="p-2">
                                                <p className="truncate text-[9px] font-medium">
                                                    {photo.name}
                                                </p>
                                                <p className="mt-1 text-[9px] text-gray-400">
                                                    {photo.size} · Berhasil diunggah ✓
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-[#f7f8f5] p-4 text-center transition hover:border-[#39776c] hover:bg-[#eaf2ed]">
                                        <CloudUpload
                                            size={23}
                                            className="mb-2 text-[#285d54]"
                                        />

                                        <span className="text-[10px] font-semibold">
                                            Tambahkan bukti foto
                                        </span>

                                        <span className="mt-2 text-[9px] text-gray-400">
                                            Klik atau seret foto ke sini
                                        </span>

                                        <span className="mt-1 text-[9px] text-gray-400">
                                            JPG / PNG · Maks. 5 MB per foto
                                        </span>

                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg"
                                            multiple
                                            className="hidden"
                                            onChange={handlePhotoUpload}
                                        />
                                    </label>
                                </div>

                                <p className="mt-4 text-[9px] text-gray-400">
                                    {photos.length} foto tersimpan. Tambahkan foto detail fasilitas dan akses sebelum mengirim laporan.
                                </p>
                            </section>

                            {/* REPORT FORM */}
                            <section className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="text-sm font-semibold">
                                    Isi laporan {selectedKos?.name}
                                </h2>

                                <p className="mb-5 mt-1 text-[10px] text-gray-400">
                                    Jelaskan temuanmu secara objektif, termasuk hal yang perlu dipertimbangkan.
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-[10px] font-medium">
                                            Harga sewa terkonfirmasi
                                        </label>

                                        <input
                                            value={hargaSewa}
                                            onChange={(e) => {
                                                setHargaSewa(e.target.value);
                                                setSaved(false);
                                            }}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-3 text-[10px] outline-none focus:border-[#39776c]"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-medium">
                                            Ketersediaan
                                        </label>

                                        <select
                                            value={availability}
                                            onChange={(e) => {
                                                setAvailability(e.target.value);
                                                setSaved(false);
                                            }}
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-[10px] outline-none focus:border-[#39776c]"
                                        >
                                            <option>1 kamar kosong</option>
                                            <option>2 kamar kosong</option>
                                            <option>3 kamar kosong</option>
                                            <option>Penuh / tidak tersedia</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-[10px] font-medium">
                                        Kondisi, fasilitas & lingkungan
                                    </label>

                                    <textarea
                                        value={condition}
                                        onChange={(e) => {
                                            setCondition(e.target.value);
                                            setSaved(false);
                                        }}
                                        rows={4}
                                        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-[10px] leading-relaxed outline-none focus:border-[#39776c]"
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-[10px] font-medium">
                                        Catatan untuk Alya
                                    </label>

                                    <textarea
                                        value={notes}
                                        onChange={(e) => {
                                            setNotes(e.target.value);
                                            setSaved(false);
                                        }}
                                        rows={3}
                                        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-[10px] leading-relaxed outline-none focus:border-[#39776c]"
                                    />
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-[9px] text-gray-400">
                                    <CloudUpload size={13} />
                                    {saved
                                        ? "Draft berhasil disimpan secara lokal"
                                        : "Draft belum disimpan"}
                                </div>
                            </section>

                            {/* BOTTOM ACTIONS */}
                            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
                                <div>
                                    <p className="text-[10px] font-semibold">
                                        Laporan masih berupa draft
                                    </p>
                                    <p className="mt-1 text-[9px] text-gray-400">
                                        Lengkapi checklist, foto, dan temuan sebelum mengirim.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveDraft}
                                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-[10px] font-semibold hover:bg-gray-50"
                                    >
                                        <Save size={13} />
                                        Simpan draf
                                    </button>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={
                                            submitting ||
                                            totalChecked < totalChecklist ||
                                            photos.length === 0
                                        }
                                        className="flex items-center gap-2 rounded-lg bg-[#145b4b] px-3 py-2.5 text-[10px] font-semibold text-white hover:bg-[#10463b] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Send size={13} />
                                        {submitting
                                            ? "Mengirim..."
                                            : "Kirim laporan"}
                                    </button>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-4">

                            {/* CUSTOMER NEEDS */}
                            <section className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="text-sm font-semibold">
                                    Kebutuhan Alya
                                </h2>

                                <span className="mt-4 inline-flex rounded-full bg-[#e6f1ec] px-3 py-1 text-[9px] font-semibold text-[#34796c]">
                                    ● Kos putri
                                </span>

                                <div className="mt-4 space-y-4">
                                    <div className="flex justify-between gap-2 text-[10px]">
                                        <span className="text-gray-400">
                                            Anggaran / bulan
                                        </span>
                                        <strong>Rp1–1,5 juta</strong>
                                    </div>

                                    <div className="flex justify-between gap-2 text-[10px]">
                                        <span className="text-gray-400">
                                            Rencana pindah
                                        </span>
                                        <strong>November 2026</strong>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 text-[10px] leading-relaxed text-gray-500">
                                        Utamakan kamar mandi dalam, ventilasi baik, Wi-Fi stabil, dan akses aman. Tolong cek tekanan air serta biaya listrik di kedua kos.
                                    </div>
                                </div>

                                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-[10px] font-semibold hover:bg-gray-50">
                                    <MessageSquare size={13} />
                                    Lihat percakapan
                                </button>
                            </section>

                            {/* INCOME SUMMARY */}
                            <section className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="text-sm font-semibold">
                                    Ringkasan pendapatan
                                </h2>

                                <div className="mt-5 space-y-4">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">
                                            Jumlah kos
                                        </span>
                                        <strong>2 kos</strong>
                                    </div>

                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">
                                            Pendapatan per kos
                                        </span>
                                        <strong>Rp75.000</strong>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-gray-400">
                                                Pendapatan bersih
                                            </span>
                                            <strong className="text-sm">
                                                Rp150.000
                                            </strong>
                                        </div>
                                    </div>

                                    <p className="text-[9px] leading-relaxed text-gray-400">
                                        Pendapatan tersedia setelah laporan lengkap diterima. Order ini belum masuk saldo dapat ditarik.
                                    </p>

                                    <span className="inline-flex rounded-full bg-[#e6f1ec] px-3 py-1 text-[9px] font-semibold text-[#34796c]">
                                        ● Pembayaran customer terkonfirmasi
                                    </span>
                                </div>
                            </section>

                            {/* WORKFLOW */}
                            <section className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="text-sm font-semibold">
                                    Alur penyelesaian
                                </h2>

                                <div className="mt-5 space-y-5">
                                    {[
                                        {
                                            title: "Order diambil",
                                            desc: "Survei menjadi tanggung jawabmu",
                                            done: true,
                                        },
                                        {
                                            title: "Kunjungan berlangsung",
                                            desc: "Periksa kondisi 2 kos",
                                            done: true,
                                        },
                                        {
                                            title: "Kirim laporan",
                                            desc: "Lengkapi checklist, foto, dan temuan",
                                            done: false,
                                        },
                                        {
                                            title: "Review customer",
                                            desc: "Dana dilepas setelah laporan diterima",
                                            done: false,
                                        },
                                    ].map((step, index) => (
                                        <div
                                            key={step.title}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="mt-0.5">
                                                {step.done ? (
                                                    <CheckCircle2
                                                        size={16}
                                                        className="text-[#34796c]"
                                                    />
                                                ) : (
                                                    <Circle
                                                        size={16}
                                                        className="text-gray-400"
                                                    />
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-semibold">
                                                    {step.title}
                                                </p>

                                                <p className="mt-1 text-[9px] text-gray-400">
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* HELP */}
                            <section className="rounded-lg bg-[#e6f1ec] p-4">
                                <div className="flex items-start gap-2">
                                    <Headphones
                                        size={17}
                                        className="shrink-0 text-[#285d54]"
                                    />

                                    <div>
                                        <p className="text-[10px] font-semibold text-[#285d54]">
                                            Butuh bantuan di lokasi?
                                        </p>

                                        <p className="mt-1 text-[9px] leading-relaxed text-[#527d74]">
                                            Hubungi tim CKIN jika kos tidak dapat diakses atau ada perubahan jadwal.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <footer className="mt-8 flex flex-wrap justify-between gap-3 pb-4 text-[9px] text-gray-400">
                        <span>©CKIN — cek dulu, baru pindah.</span>

                        <div className="flex gap-3">
                            <span className="cursor-pointer hover:text-[#285d54]">
                                Pusat bantuan
                            </span>
                            <span>·</span>
                            <span className="cursor-pointer hover:text-[#285d54]">
                                Syarat & ketentuan
                            </span>
                            <span>·</span>
                            <span className="cursor-pointer hover:text-[#285d54]">
                                Privasi
                            </span>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
