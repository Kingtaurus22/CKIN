"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ClipboardList,
    CalendarDays,
    Search,
    Plus,
    ArrowRight,
    FileClock,
} from "lucide-react";

import Footer from "@/src/components/surveyor/footer";
import { OrderTypeSurveyor } from "@/types";
import { formatDate, formatRupiah } from "@/db/helpers/format";

type DisplayStatus =
    | "Terjadwal"
    | "Dalam proses"
    | "Menunggu review"
    | "Selesai"
    | "Dibatalkan";

type TabStatus = "Semua" | "Dalam proses" | "Selesai";

export default function OrderSurveiPage() {
    const [orders, setOrders] = useState<OrderTypeSurveyor[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<TabStatus>("Semua");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [totalThisWeek, setTotalThisWeek] = useState(0);

    const pageSize = 8;

    // Fetch data order
    useEffect(() => {
        async function fetchOrders() {
            try {
                const response = await fetch("/api/orders/surveyor");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || data.error);
                }

                setOrders(data);
            } catch (error) {
                console.error("Gagal mengambil order:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, []);

    // Mengubah status database menjadi status tampilan
    const getStatus = (assignmentStatus: string): DisplayStatus => {
        switch (assignmentStatus) {
            case "ASSIGNED":
                return "Dalam proses";

            case "COMPLETED":
                return "Selesai";

            case "CANCELLED":
                return "Dibatalkan";

            default:
                return "Terjadwal";
        }
    };


    // Format lokasi
    function getLocation(order: OrderTypeSurveyor) {
        return `${order.surveyLocation.district}, ${order.surveyLocation.city}`;
    }

    // Jumlah order berdasarkan status
    const totalInProgress = orders.filter(
        (order) => order.assignmentStatus === "ASSIGNED"
    ).length;

    const totalCompleted = orders.filter(
        (order) => order.assignmentStatus === "COMPLETED"
    ).length;

    // Menghitung survei pada minggu berjalan
    useEffect(() => {
        const today = new Date();

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const total = orders.filter((order) => {
            const date = new Date(order.surveyDate);

            return date >= startOfWeek && date < endOfWeek;
        }).length;

        setTotalThisWeek(total);
    }, [orders]);

    const totalWaitingReview = 0;

    // Jumlah setiap tab
    const tabs = [
        {
            label: "Semua" as TabStatus,
            count: orders.length,
        },
        {
            label: "Dalam proses" as TabStatus,
            count: totalInProgress,
        },
        {
            label: "Selesai" as TabStatus,
            count: totalCompleted,
        },
    ];

    // Filter Data
    const filteredOrders = orders.filter((order) => {
        const matchesStatus =
            activeTab === "Semua" ||
            getStatus(order.assignmentStatus) === activeTab;

        const customerName = order.customerName || "";

        const matchesSearch =
            customerName.toLowerCase().includes(search.toLowerCase()) ||
            order._id.toLowerCase().includes(search.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    // Pagination
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

    // Ganti tab dan reset halaman
    function changeTab(value: TabStatus) {
        setActiveTab(value);
        setPage(1);
    }

    // Ganti pencarian dan reset halaman
    function changeSearch(value: string) {
        setSearch(value);
        setPage(1);
    }

    // Reset filter
    function resetFilter() {
        setSearch("");
        setActiveTab("Semua");
        setPage(1);
    }

    // Tampilan status
    function StatusBadge({ status }: { status: DisplayStatus }) {
        const styles: Record<DisplayStatus, string> = {
            Terjadwal: "bg-[#f2f4f1] text-[#75837d]",
            "Dalam proses": "bg-[#e6f1ec] text-[#327568]",
            "Menunggu review": "bg-[#fff2dc] text-[#a56a19]",
            Selesai: "bg-[#e6f1ec] text-[#327568]",
            Dibatalkan: "bg-red-50 text-red-600",
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
                            Semua order yang sudah kamu ambil, dari jadwal
                            kunjungan hingga laporan selesai.
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
                            value: totalInProgress,
                            icon: ClipboardList,
                        },
                        {
                            title: "Survei minggu ini",
                            value: totalThisWeek,
                            icon: CalendarDays,
                        },
                        {
                            title: "Laporan menunggu review",
                            value: totalWaitingReview,
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
                                    onChange={(e) =>
                                        changeSearch(e.target.value)
                                    }
                                    placeholder="Cari nama customer atau nomor pesanan..."
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-[#f5f6f3] pl-10 pr-3 text-xs outline-none focus:border-[#39776c] focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* TABS */}
                        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.label}
                                    onClick={() => changeTab(tab.label)}
                                    className={`shrink-0 rounded-lg px-4 py-3 text-[11px] transition ${activeTab === tab.label
                                        ? "bg-[#e6f1ec] font-semibold text-[#174d43]"
                                        : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    {tab.label} {tab.count}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LOADING */}
                    {loading && (
                        <div className="px-4 py-16 text-center text-xs text-gray-400">
                            Mengambil data order...
                        </div>
                    )}

                    {/* DESKTOP TABLE */}
                    {!loading && filteredOrders.length > 0 && (
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
                                            key={order._id}
                                            className="border-b border-gray-200 transition last:border-0 hover:bg-[#f7faf7]"
                                        >
                                            <td className="px-5 py-5">
                                                <p className="text-xs font-semibold">
                                                    {order.customerName}
                                                </p>

                                                <p className="mt-1 break-all text-[10px] text-gray-400">
                                                    {order._id}
                                                </p>

                                                <p className="mt-1 text-[10px] text-[#43877c]">
                                                    {order.status === "PAID"
                                                        ? "Sudah dibayar"
                                                        : "Belum dibayar"}
                                                </p>
                                            </td>

                                            <td className="px-4 py-5">
                                                <p className="text-xs">
                                                    {getLocation(order)}
                                                </p>

                                                <p className="mt-1 text-[10px] text-gray-400">
                                                    {order.kosCount} kos
                                                </p>
                                            </td>

                                            <td className="px-4 py-5">
                                                <p className="text-xs">
                                                    {formatDate(order.surveyDate)}
                                                </p>

                                                <p className="mt-1 text-[10px] text-gray-400">
                                                    Waktu belum ditentukan
                                                </p>
                                            </td>

                                            <td className="px-4 py-5">
                                                <StatusBadge
                                                    status={getStatus(
                                                        order.assignmentStatus
                                                    )}
                                                />
                                            </td>

                                            <td className="px-4 py-5 text-xs font-semibold">
                                                {formatRupiah(order.pricing)}
                                            </td>

                                            <td className="px-4 py-5">
                                                <Link
                                                    href={`/surveyor/order-survei/${order._id}`}
                                                    className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-[#174d43] hover:text-[#43877c]"
                                                >
                                                    {order.assignmentStatus ===
                                                        "COMPLETED"
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
                    )}

                    {/* MOBILE CARDS */}
                    {!loading && filteredOrders.length > 0 && (
                        <div className="space-y-3 p-4 md:hidden">
                            {paginatedOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className="rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {order.customerName}
                                            </p>

                                            <p className="mt-1 break-all text-[10px] text-gray-400">
                                                {order._id}
                                            </p>
                                        </div>

                                        <StatusBadge
                                            status={getStatus(
                                                order.assignmentStatus
                                            )}
                                        />
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-[10px] text-gray-400">
                                                Lokasi
                                            </p>

                                            <p className="mt-1">
                                                {getLocation(order)}
                                            </p>

                                            <p className="text-[10px] text-gray-400">
                                                {order.kosCount} kos
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-gray-400">
                                                Jadwal survei
                                            </p>

                                            <p className="mt-1">
                                                {formatDate(order.surveyDate)}
                                            </p>

                                            <p className="text-[10px] text-gray-400">
                                                Waktu belum ditentukan
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                                        <span className="text-xs font-semibold">
                                            {formatRupiah(order.pricing)}
                                        </span>

                                        <Link
                                            href={`/surveyor/order-survei/${order._id}`}
                                            className="flex items-center gap-1 text-[11px] font-semibold text-[#174d43]"
                                        >
                                            {order.assignmentStatus ===
                                                "COMPLETED"
                                                ? "Lihat laporan"
                                                : "Kelola survei"}

                                            <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* EMPTY STATE */}
                    {!loading && filteredOrders.length === 0 && (
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
                                onClick={resetFilter}
                                className="mt-4 text-xs font-semibold text-[#327568] hover:underline"
                            >
                                Reset filter
                            </button>
                        </div>
                    )}

                    {/* PAGINATION */}
                    {!loading && filteredOrders.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:px-5">
                            <p className="text-[10px] text-gray-400">
                                Menampilkan {startNumber}–{endNumber} dari{" "}
                                {filteredOrders.length} order
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setPage((prev) =>
                                            Math.max(1, prev - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-[10px] font-semibold hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Sebelumnya
                                </button>

                                <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-[#103f3a] px-2 text-xs font-semibold text-white">
                                    {currentPage}
                                </span>

                                <button
                                    onClick={() =>
                                        setPage((prev) =>
                                            Math.min(totalPages, prev + 1)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-[10px] font-semibold hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
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
                            Lengkapi checklist bukti foto dan video, lalu kirim
                            laporan agar customer dapat meninjau hasil surveimu.
                        </p>
                    </div>
                </section>

                {/* FOOTER */}
                <Footer />
            </main>
        </div>
    );
}
