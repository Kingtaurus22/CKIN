"use client";

import { useMemo, useState } from "react";
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
    CalendarDays,
    Search,
    Plus,
    ArrowRight,
    Menu,
    X,
    FileClock,
} from "lucide-react";
import Footer from "@/src/components/surveyor/footer";

type OrderStatus =
    | "Terjadwal"
    | "Dalam proses"
    | "Menunggu review"
    | "Selesai";

type Order = {
    id: string;
    customer: string;
    orderNumber: string;
    location: string;
    totalKos: number;
    date: string;
    dateLabel: string;
    time: string;
    status: OrderStatus;
    income: number;
};

const orders: Order[] = [
    {
        id: "6aef4e352f3773eb236d1ba9",
        customer: "Alya Putri",
        orderNumber: "#SGH-261102",
        location: "Mlati, Sleman",
        totalKos: 2,
        date: "2026-11-06",
        dateLabel: "06 Nov 2026",
        time: "09.00–12.00 WIB",
        status: "Dalam proses",
        income: 150000,
    },
    {
        id: "order-02",
        customer: "Rizky Pratama",
        orderNumber: "#SGH-261114",
        location: "Depok, Sleman",
        totalKos: 3,
        date: "2026-11-10",
        dateLabel: "10 Nov 2026",
        time: "09.00–12.00 WIB",
        status: "Terjadwal",
        income: 225000,
    },
    {
        id: "order-03",
        customer: "Nadia Safitri",
        orderNumber: "#SGH-261115",
        location: "Mlati, Sleman",
        totalKos: 2,
        date: "2026-11-12",
        dateLabel: "12 Nov 2026",
        time: "13.00–16.00 WIB",
        status: "Terjadwal",
        income: 150000,
    },
    {
        id: "order-04",
        customer: "Arman Hidayat",
        orderNumber: "#SGH-261116",
        location: "Ngaglik, Sleman",
        totalKos: 1,
        date: "2026-11-15",
        dateLabel: "15 Nov 2026",
        time: "09.00–12.00 WIB",
        status: "Terjadwal",
        income: 75000,
    },
    {
        id: "order-05",
        customer: "Citra Anindya",
        orderNumber: "#SGH-261109",
        location: "Mlati, Sleman",
        totalKos: 4,
        date: "2026-11-05",
        dateLabel: "05 Nov 2026",
        time: "13.00–16.00 WIB",
        status: "Menunggu review",
        income: 300000,
    },
    {
        id: "order-06",
        customer: "Salsa Maharani",
        orderNumber: "#SGH-261113",
        location: "Depok, Sleman",
        totalKos: 2,
        date: "2026-11-06",
        dateLabel: "06 Nov 2026",
        time: "07.00–09.00 WIB",
        status: "Selesai",
        income: 150000,
    },
    {
        id: "order-07",
        customer: "Dimas Saputra",
        orderNumber: "#SGH-261031",
        location: "Ngaglik, Sleman",
        totalKos: 1,
        date: "2026-10-31",
        dateLabel: "31 Okt 2026",
        time: "13.00–16.00 WIB",
        status: "Selesai",
        income: 75000,
    },
    {
        id: "order-08",
        customer: "Alya Putri",
        orderNumber: "#SGH-261024",
        location: "Depok, Sleman",
        totalKos: 3,
        date: "2026-10-24",
        dateLabel: "24 Okt 2026",
        time: "09.00–12.00 WIB",
        status: "Selesai",
        income: 225000,
    },
    {
        id: "order-09",
        customer: "Fajar Ramadhan",
        orderNumber: "#SGH-261020",
        location: "Mlati, Sleman",
        totalKos: 2,
        date: "2026-10-20",
        dateLabel: "20 Okt 2026",
        time: "09.00–12.00 WIB",
        status: "Selesai",
        income: 150000,
    },
    {
        id: "order-10",
        customer: "Dewi Anggraini",
        orderNumber: "#SGH-261018",
        location: "Depok, Sleman",
        totalKos: 1,
        date: "2026-10-18",
        dateLabel: "18 Okt 2026",
        time: "13.00–16.00 WIB",
        status: "Selesai",
        income: 75000,
    },
    {
        id: "order-11",
        customer: "Rani Amelia",
        orderNumber: "#SGH-261015",
        location: "Ngaglik, Sleman",
        totalKos: 2,
        date: "2026-10-15",
        dateLabel: "15 Okt 2026",
        time: "09.00–12.00 WIB",
        status: "Selesai",
        income: 150000,
    },
    {
        id: "order-12",
        customer: "Andi Saputra",
        orderNumber: "#SGH-261010",
        location: "Mlati, Sleman",
        totalKos: 1,
        date: "2026-10-10",
        dateLabel: "10 Okt 2026",
        time: "13.00–16.00 WIB",
        status: "Selesai",
        income: 75000,
    },
];

const tabs = [
    { label: "Semua", value: "Semua", count: 12 },
    { label: "Terjadwal", value: "Terjadwal", count: 3 },
    { label: "Dalam proses", value: "Dalam proses", count: 1 },
    { label: "Menunggu review", value: "Menunggu review", count: 1 },
    { label: "Selesai", value: "Selesai", count: 7 },
];

const navigation = [
    {
        label: "Dashboard",
        href: "/surveyor/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Order tersedia",
        href: "/surveyor/order-tersedia",
        icon: MapPin,
    },
    {
        label: "Order survei",
        href: "/surveyor/order-survei",
        icon: ClipboardList,
        active: true,
    },
    {
        label: "Pesan",
        href: "/surveyor/pesan",
        icon: MessageSquare,
        badge: "2",
    },
    {
        label: "Penghasilan",
        href: "/surveyor/penghasilan",
        icon: Wallet,
    },
];

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function StatusBadge({ status }: { status: OrderStatus }) {
    const styles: Record<OrderStatus, string> = {
        "Terjadwal": "bg-[#f2f4f1] text-[#75837d]",
        "Dalam proses": "bg-[#e6f1ec] text-[#327568]",
        "Menunggu review": "bg-[#fff2dc] text-[#a56a19]",
        "Selesai": "bg-[#e6f1ec] text-[#327568]",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}
        >
            <span>●</span>
            {status}
        </span>
    );
}

export default function OrderSurveiPage() {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("Semua");
    const [selectedDate, setSelectedDate] = useState("");
    const [page, setPage] = useState(1);
    const [mobileMenu, setMobileMenu] = useState(false);

    const pageSize = 8;

    // FILTER DATA
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const keyword = search.toLowerCase();

            const matchSearch =
                order.customer.toLowerCase().includes(keyword) ||
                order.orderNumber.toLowerCase().includes(keyword);

            const matchStatus =
                activeTab === "Semua" ||
                order.status === activeTab;

            const matchDate =
                !selectedDate || order.date === selectedDate;

            return matchSearch && matchStatus && matchDate;
        });
    }, [search, activeTab, selectedDate]);

    // PAGINATION
    const totalPages = Math.max(
        1,
        Math.ceil(filteredOrders.length / pageSize)
    );

    const currentPage = Math.min(page, totalPages);

    const startIndex = (currentPage - 1) * pageSize;

    const paginatedOrders = filteredOrders.slice(
        startIndex,
        startIndex + pageSize
    );

    const startNumber =
        filteredOrders.length === 0 ? 0 : startIndex + 1;

    const endNumber = Math.min(
        startIndex + pageSize,
        filteredOrders.length
    );

    function changeTab(value: string) {
        setActiveTab(value);
        setPage(1);
    }

    function changeSearch(value: string) {
        setSearch(value);
        setPage(1);
    }

    function changeDate(value: string) {
        setSelectedDate(value);
        setPage(1);
    }

    return (
        <div className="min-h-screen bg-[#f4f6f2] text-[#203a36]">
            <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">

                {/* PAGE TITLE */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="mb-1 text-[10px] font-semibold tracking-[2px] text-[#43877c]">
                            RUANG SURVEYOR
                        </p>

                        <h1 className="text-2xl font-semibold">
                            Order survei
                        </h1>

                        <p className="mt-2 text-xs text-gray-500">
                            Semua order yang sudah kamu ambil, dari jadwal kunjungan hingga laporan selesai.
                        </p>
                    </div>

                    <Link
                        href="/surveyor/order-tersedia"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-[#17463d] transition hover:bg-[#e8f1ec]"
                    >
                        <Plus size={16} />
                        Cari order baru
                    </Link>
                </div>

                {/* STATISTICS */}
                <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                        {
                            title: "Order berjalan",
                            value: 5,
                            icon: ClipboardList,
                        },
                        {
                            title: "Survei minggu ini",
                            value: 2,
                            icon: CalendarDays,
                        },
                        {
                            title: "Laporan menunggu review",
                            value: 1,
                            icon: FileClock,
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.title}
                                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e6f1ec] text-[#174d43]">
                                    <Icon size={20} />
                                </div>

                                <div>
                                    <p className="text-2xl font-semibold">
                                        {item.value}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        {item.title}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* ORDER TABLE */}
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                    {/* SEARCH */}
                    <div className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => changeSearch(e.target.value)}
                                    placeholder="Cari nama customer atau nomor pesanan..."
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-[#f5f6f3] pl-10 pr-3 text-xs outline-none focus:border-[#39776c] focus:bg-white"
                                />
                            </div>

                            <div className="relative">
                                <CalendarDays
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#174d43]"
                                />

                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => changeDate(e.target.value)}
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-[#174d43] outline-none focus:border-[#39776c] sm:w-[165px]"
                                />
                            </div>
                        </div>

                        {selectedDate && (
                            <button
                                onClick={() => changeDate("")}
                                className="mt-2 text-xs text-[#327568] hover:underline"
                            >
                                Hapus filter tanggal ×
                            </button>
                        )}

                        {/* TABS */}
                        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => changeTab(tab.value)}
                                    className={`shrink-0 rounded-lg px-4 py-3 text-[11px] transition ${activeTab === tab.value
                                        ? "bg-[#e6f1ec] font-semibold text-[#174d43]"
                                        : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    {tab.label} {tab.count}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[850px] text-left">
                            <thead className="bg-[#f5f7f3]">
                                <tr className="text-[10px] uppercase text-gray-500">
                                    <th className="px-5 py-4 font-medium">
                                        Customer / Pesanan
                                    </th>
                                    <th className="px-4 py-4 font-medium">
                                        Lokasi
                                    </th>
                                    <th className="px-4 py-4 font-medium">
                                        Jadwal survei
                                    </th>
                                    <th className="px-4 py-4 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-4 font-medium">
                                        Pendapatan
                                    </th>
                                    <th className="px-4 py-4 font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-gray-200 transition last:border-0 hover:bg-[#f7faf7]"
                                    >
                                        <td className="px-5 py-5">
                                            <p className="text-xs font-semibold">
                                                {order.customer}
                                            </p>
                                            <p className="mt-1 text-[10px] text-gray-400">
                                                {order.orderNumber}
                                            </p>
                                            <p className="mt-1 text-[10px] text-[#43877c]">
                                                Sudah dibayar
                                            </p>
                                        </td>

                                        <td className="px-4 py-5">
                                            <p className="text-xs">
                                                {order.location}
                                            </p>
                                            <p className="mt-1 text-[10px] text-gray-400">
                                                {order.totalKos} kos
                                            </p>
                                        </td>

                                        <td className="px-4 py-5">
                                            <p className="text-xs">
                                                {order.dateLabel}
                                            </p>
                                            <p className="mt-1 text-[10px] text-gray-400">
                                                {order.time}
                                            </p>
                                        </td>

                                        <td className="px-4 py-5">
                                            <StatusBadge status={order.status} />
                                        </td>

                                        <td className="px-4 py-5 text-xs font-semibold">
                                            {formatRupiah(order.income)}
                                        </td>

                                        <td className="px-4 py-5">
                                            <Link
                                                href={`/surveyor/order-survei/${order.id}`}
                                                className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-[#174d43] hover:text-[#43877c]"
                                            >
                                                {order.status === "Selesai"
                                                    ? "Lihat laporan"
                                                    : "Kelola survei"}
                                                <ArrowRight size={13} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="space-y-3 p-4 md:hidden">
                        {paginatedOrders.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-lg border border-gray-200 p-4"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {order.customer}
                                        </p>
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {order.orderNumber}
                                        </p>
                                    </div>

                                    <StatusBadge status={order.status} />
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-[10px] text-gray-400">
                                            Lokasi
                                        </p>
                                        <p className="mt-1">{order.location}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {order.totalKos} kos
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-gray-400">
                                            Jadwal survei
                                        </p>
                                        <p className="mt-1">{order.dateLabel}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {order.time}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                                    <span className="text-xs font-semibold">
                                        {formatRupiah(order.income)}
                                    </span>

                                    <Link
                                        href={`/surveyor/order-survei/${order.id}`}
                                        className="flex items-center gap-1 text-[11px] font-semibold text-[#174d43]"
                                    >
                                        {order.status === "Selesai"
                                            ? "Lihat laporan"
                                            : "Kelola survei"}
                                        <ArrowRight size={13} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* EMPTY STATE */}
                    {filteredOrders.length === 0 && (
                        <div className="px-4 py-16 text-center">
                            <Search
                                size={30}
                                className="mx-auto mb-3 text-gray-300"
                            />
                            <h3 className="text-sm font-semibold">
                                Order tidak ditemukan
                            </h3>
                            <p className="mt-2 text-xs text-gray-400">
                                Coba gunakan kata kunci atau filter lainnya.
                            </p>
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setActiveTab("Semua");
                                    setSelectedDate("");
                                    setPage(1);
                                }}
                                className="mt-4 text-xs font-semibold text-[#327568] hover:underline"
                            >
                                Reset filter
                            </button>
                        </div>
                    )}

                    {/* PAGINATION */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:px-5">
                        <p className="text-[10px] text-gray-400">
                            Menampilkan {startNumber}–{endNumber} dari{" "}
                            {filteredOrders.length} order milik Bima
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-[10px] font-semibold hover:bg-gray-50 disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>

                            <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-[#103f3a] px-2 text-xs font-semibold text-white">
                                {currentPage}
                            </span>

                            <button
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-[10px] font-semibold hover:bg-gray-50 disabled:opacity-40"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                </section>

                {/* INFO BANNER */}
                <section className="mt-5 flex items-start gap-3 rounded-lg bg-[#e6f1ec] p-4">
                    <ClipboardList
                        size={18}
                        className="mt-0.5 shrink-0 text-[#174d43]"
                    />

                    <div>
                        <p className="text-xs font-semibold text-[#174d43]">
                            Perbarui progres setelah setiap kunjungan
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-[#43877c]">
                            Lengkapi checklist dan bukti foto, lalu kirim laporan agar customer dapat meninjau hasil surveimu.
                        </p>
                    </div>
                </section>

                {/* FOOTER */}
                <Footer />
            </main>
        </div>
    );

}
