"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Footer from "@/src/components/surveyor/footer";
import { OrderTypeSurveyor, SurveyorType } from "@/types";
import {
    ClipboardList,
    MapPin,
    Wallet,
    CalendarDays,
    SlidersHorizontal,
    ArrowRight
} from "lucide-react";
import { formatDate, formatRupiah } from "@/db/helpers/format";

export default function SurveyorDashboard() {
    const [availableOrders, setAvailableOrders] = useState<OrderTypeSurveyor[]>([])
    const [myOrders, setMyOrders] = useState<OrderTypeSurveyor[]>([])
    const [surveyor, setSurveyor] = useState<SurveyorType>();

    const [currentMonth, setCurrentMonth] = useState("");

    useEffect(() => {
        async function fetchOrders() {
            // Fetch order tersedia berdasarkan jangkauan
            const res = await fetch("http://localhost:3000/api/orders");
            const orders: OrderTypeSurveyor[] = await res.json();

            setAvailableOrders(orders);

            // Fetch order yang sudah diambil surveyor
            const resSurvey = await fetch("http://localhost:3000/api/orders/surveyor");
            const surveyOrders: OrderTypeSurveyor[] = await resSurvey.json();

            setMyOrders(surveyOrders);
        }

        fetchOrders();
    }, []);

    // Mengambil data dari surveyor yang login
    useEffect(() => {
        async function fetchSurveyorLogin() {
            const res = await fetch("http://localhost:3000/api/surveyors/6aef49fcd6d282d09954efd9");
            const surveyorProfile: SurveyorType = await res.json();

            setSurveyor(surveyorProfile);
        }

        fetchSurveyorLogin()
    }, [])

    // Menentukan bulan sekarang
    useEffect(() => {
        const month = new Date().toLocaleDateString("id-ID", {
            month: "long",
        });

        setCurrentMonth(month);
    }, []);

    // Menghitung order yang sedang berjalan
    const totalOrdersInProgress = myOrders.filter(
        (order) => order.assignmentStatus === "ASSIGNED"
    ).length;

    // Menghitung order yang tersedia di area surveyor
    const totalAvailableOrders = availableOrders.length;

    // Menghitung jumlah pendapatan perbulan
    const totalIncomeThisMonth = myOrders
        .filter((order) => {
            const date = new Date(order.surveyDate);
            const now = new Date();

            return (
                order.assignmentStatus === "COMPLETED" &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
            );
        })
        .reduce((total, order) => total + order.pricing, 0);

    // Maksimal 3 order tersedia
    const displayedAvailableOrders = availableOrders.slice(0, 3);

    // Maksimal 3 order yang sudah diambil
    const displayedMyOrders = myOrders.slice(0, 3);

    return (
        <main className="min-h-screen bg-[#f5f7f3] p-5 md:p-8">
            {/* Header */}
            <section className="mb-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#42766e]">
                            Ruang Surveyor
                        </p>

                        <h1 className="mt-2 text-2xl font-semibold text-[#233d39] md:text-3xl">
                            Halo, {surveyor?.fullname}. Siap bantu hari ini?
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Temukan order di sekitarmu dan kelola setiap survei dengan rapi.
                        </p>
                    </div>
                </div>
            </section>

            {/* Statistics */}
            <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {/* Order Berjalan */}
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ed] text-[#285d54]">
                        <ClipboardList size={23} />
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Order berjalan</p>
                        <h2 className="mt-1 text-2xl font-semibold text-[#263e3a]">
                            {totalOrdersInProgress}
                        </h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Order yang sedang kamu kerjakan
                        </p>
                    </div>
                </div>

                {/* Order Tersedia */}
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ed] text-[#285d54]">
                        <MapPin size={23} />
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Order di areamu</p>
                        <h2 className="mt-1 text-2xl font-semibold text-[#263e3a]">
                            {totalAvailableOrders}
                        </h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Sesuai area jangkauanmu
                        </p>
                    </div>
                </div>

                {/* Total Pendapatan */}
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ed] text-[#285d54]">
                        <Wallet size={23} />
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Pendapatan {currentMonth}</p>
                        <h2 className="mt-1 text-2xl font-semibold text-[#263e3a]">
                            {formatRupiah(totalIncomeThisMonth)}
                        </h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Akumulasi pendapatan survei perbulan
                        </p>
                    </div>
                </div>
            </section>

            {/* Available Orders and Surveyor Information */}
            <section className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Available Orders */}
                <div className="xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[#263e3a]">
                                Order tersedia di sekitarmu
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Hanya order terbaru dalam area jangkauanmu yang ditampilkan.
                            </p>
                        </div>

                        <Link
                            href="/surveyor/order-tersedia"
                            className="inline-flex items-center gap-2 font-semibold text-[#145b4b] transition-colors hover:text-[#0d4036] group"
                        >
                            Lihat semua order

                            <ArrowRight
                                size={20}
                                className="transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {availableOrders.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                                <MapPin className="mx-auto mb-3 text-gray-400" size={32} />

                                <h3 className="font-semibold text-gray-700">
                                    Belum ada order tersedia
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Saat ini belum ada order yang sesuai dengan area jangkauanmu.
                                    Silakan cek kembali nanti.
                                </p>
                            </div>
                        ) : (
                            displayedAvailableOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className="rounded-xl border border-gray-200 bg-white p-5"
                                >
                                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                        {/* Order Information */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f1ed] text-sm font-semibold text-[#39786b]">
                                                {order.customerName
                                                    .split(" ")
                                                    .map((word) => word[0])
                                                    .join("")
                                                    .slice(0, 2) || "👤"}
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-medium text-[#263e3a]">
                                                        {order.surveyLocation.district}, {order.surveyLocation.city}
                                                    </h3>

                                                    <span className="rounded-full bg-[#e5f1eb] px-3 py-1 text-xs font-medium text-[#39786b]">
                                                        ● {order.status === "PAID" ? "Sudah Dibayar" : "PAID"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    {order.customerName} · No. Order: {order._id}

                                                </p>

                                                <p className="mt-2 text-sm text-[#40544f]">
                                                    {order.kosCount} kos · {order.serviceType === "USER_CHOICE" ? "Pilihan Pengguna" : "Rekomendasi Surveyor"}
                                                </p>

                                                <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                                    <CalendarDays size={14} />
                                                    {formatDate(order.surveyDate)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Price and Button */}
                                        <div className="flex shrink-0 items-center justify-between gap-4 md:flex-col md:items-end">
                                            <p className="text-lg font-semibold text-[#263e3a]">
                                                {formatRupiah(order.pricing)}
                                            </p>

                                            <Link
                                                href={`/surveyor/order-tersedia?orderId=${order._id}`}
                                                className="inline-flex items-center justify-center rounded-xl border border-[#d2e5dc] px-3 py-3 font-semibold text-[#285d54] transition hover:bg-[#e7f1ec] text-sm"
                                            >
                                                Lihat & ambil order
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                    </div>

                    <button className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#285d54] sm:hidden">
                        Lihat semua order <ArrowRight size={16} />
                    </button>
                </div>

                {/* Surveyor Information */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h2 className="text-lg font-semibold text-[#263e3a]">
                            Domisili & jangkauan
                        </h2>

                        <div className="mt-5 flex gap-3">
                            <MapPin className="shrink-0 text-[#39786b]" size={21} />

                            <div>
                                <p className="text-sm font-semibold text-[#263e3a]">
                                    {surveyor?.domicileDistrict}, {surveyor?.domicileCity}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    {surveyor?.domicileProvince}
                                </p>
                            </div>
                        </div>

                        <hr className="my-5 border-gray-200" />

                        <p className="text-xs font-medium uppercase text-gray-400">
                            Area jangkauan aktif
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {surveyor?.coverageAreas?.districts?.map((area) => (
                                <span
                                    key={area}
                                    className="rounded-full bg-[#e5f1eb] px-3 py-1.5 text-xs font-medium text-[#39786b]"
                                >
                                    ● {area}
                                </span>
                            ))}
                        </div>

                        <p className="mt-5 text-xs leading-5 text-gray-400">
                            Order dicocokkan dengan domisili dan area yang kamu pilih, bukan
                            seluruh kota.
                        </p>

                        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-3 text-sm font-semibold text-[#285d54] hover:bg-[#f5f7f3]">
                            <SlidersHorizontal size={16} />
                            Atur jangkauan
                        </button>
                    </div>
                </div>
            </section>

            {/* Survey Order List */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {/* Table Header */}
                <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-[#263e3a]">
                            Daftar order survei yang sudah kamu ambil
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Perbarui progres dan kirim laporan dari detail order.
                        </p>
                    </div>

                    <div className="flex gap-5 text-sm">
                        <button className="hidden items-center gap-1 text-sm font-semibold text-[#285d54] hover:text-[#43877a] sm:flex">
                            Lihat semua order <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                        <thead className="bg-[#f5f7f3] text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-4 font-medium">
                                    Pengguna / Pesanan
                                </th>
                                <th className="px-5 py-4 font-medium">
                                    Lokasi & Jadwal
                                </th>
                                <th className="px-5 py-4 font-medium">
                                    Status Survei
                                </th>
                                <th className="px-5 py-4 font-medium">
                                    Pembayaran
                                </th>
                                <th className="px-5 py-4 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10">
                                        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                                            <ClipboardList
                                                className="mx-auto mb-3 text-gray-400"
                                                size={32}
                                            />

                                            <h3 className="font-semibold text-gray-700">
                                                Belum ada order survei
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Kamu belum mengambil order survei.
                                                Temukan order yang sesuai dengan area jangkauanmu.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayedMyOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="border-t border-gray-200 text-sm"
                                    >
                                        <td className="px-5 py-5">
                                            <p className="font-semibold text-[#263e3a]">
                                                {order.customerName}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                {order._id}
                                            </p>
                                        </td>

                                        <td className="px-5 py-5 text-[#40544f]">
                                            {order.surveyLocation.district} · {formatDate(order.surveyDate)}
                                        </td>

                                        <td className="px-5 py-5">
                                            {order.assignmentStatus === "CANCELLED" ? (
                                                <span className="whitespace-nowrap rounded-full bg-[#f7e3dc] px-3 py-1.5 text-xs font-medium text-[#d13636]">
                                                    ● Cancel
                                                </span>
                                            ) : (
                                                <span className="whitespace-nowrap rounded-full bg-[#e5f1eb] px-3 py-1.5 text-xs font-medium text-[#39786b]">
                                                    ● {order.assignmentStatus === "ASSIGNED"
                                                        ? "Dalam Proses"
                                                        : "Laporan Diterima"}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-5 py-5 text-sm text-[#39786b]">
                                            Sudah dibayar
                                        </td>

                                        <td className="px-5 py-5">
                                            <button className="flex items-center gap-1 whitespace-nowrap font-semibold text-[#285d54] hover:text-[#43877a]">
                                                {order.assignmentStatus === "ASSIGNED"
                                                    ? "Kelola survei"
                                                    : order.assignmentStatus === "COMPLETED"
                                                        ? "Lihat laporan"
                                                        : "Lihat Order"}

                                                <ArrowRight size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Footer Help */}
            <Footer />
        </main>
    );
}
