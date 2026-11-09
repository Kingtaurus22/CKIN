"use client";

import { useEffect, useMemo, useState } from "react";
import {
    SlidersHorizontal,
    CalendarDays,
    ShieldCheck,
    MapPin,
    Check,
    ArrowRight,
    Plus,
    UserRound,
} from "lucide-react";
import Swal from "sweetalert2";

import { formatRupiah } from "@/db/helpers/format";
import { OrderTypeSurveyor, SurveyorType } from "@/types";
import Footer from "@/src/components/surveyor/footer";

export default function AvailableOrdersPage() {
    // State data dari API
    const [availableOrders, setAvailableOrders] = useState<OrderTypeSurveyor[]>([]);
    const [surveyor, setSurveyor] = useState<SurveyorType>();

    // State tampilan
    const [selectedOrder, setSelectedOrder] = useState<OrderTypeSurveyor | null>(null);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

    // State error
    const [error, setError] = useState("");

    // State take order
    const [isTakingOrder, setIsTakingOrder] = useState(false);
    const [assignedOrdersCount, setAssignedOrdersCount] = useState(0);

    const MAX_ORDERS = 3;

    const remainingOrders = Math.max(
        0,
        MAX_ORDERS - assignedOrdersCount
    );

    // Fetch data order tersedia
    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch("http://localhost:3000/api/orders");

                if (!res.ok) {
                    throw new Error("Gagal mengambil data order.");
                }

                const orders: OrderTypeSurveyor[] = await res.json();

                setAvailableOrders(orders);
            } catch (error) {
                console.error(error);
                setError("Terjadi kesalahan saat mengambil data order.");
            }
        }

        fetchOrders();
    }, []);

    // Fetch data surveyor yang login
    useEffect(() => {
        async function fetchSurveyorLogin() {
            try {
                const res = await fetch(
                    "http://localhost:3000/api/surveyors/6aef49fcd6d282d09954efd9"
                );

                if (!res.ok) {
                    throw new Error("Gagal mengambil data surveyor.");
                }

                const surveyorProfile: SurveyorType = await res.json();

                setSurveyor(surveyorProfile);
            } catch (error) {
                console.error(error);
                setError("Terjadi kesalahan saat mengambil data surveyor.");
            }
        }

        fetchSurveyorLogin();
    }, []);

    // Mengambil area jangkauan surveyor
    const areas = surveyor?.coverageAreas?.districts ?? [];

    // Mengatur filter area setelah data surveyor tersedia
    useEffect(() => {
        if (surveyor) {
            setSelectedAreas(surveyor.coverageAreas.districts);
        }
    }, [surveyor]);

    // Fetch order yang sedang dikerjakan surveyor
    useEffect(() => {
        if (!surveyor?._id) return;

        async function fetchAssignedOrders() {
            try {
                const res = await fetch(
                    `http://localhost:3000/api/orders/surveyor/${surveyor!._id}`
                );

                if (!res.ok) {
                    throw new Error("Gagal mengambil order surveyor.");
                }

                const orders = await res.json();

                setAssignedOrdersCount(orders.length);

            } catch (error) {
                console.error(error);
                setError("Gagal mengambil data order yang sedang dikerjakan.");
            }
        }

        fetchAssignedOrders();
    }, [surveyor]);

    // Memilih atau menghapus filter area
    function toggleArea(area: string) {
        if (selectedAreas.includes(area)) {
            setSelectedAreas(
                selectedAreas.filter((item) => item !== area)
            );
        } else {
            setSelectedAreas([...selectedAreas, area]);
        }
    }

    // Filter order berdasarkan area
    const filteredOrders = useMemo(() => {
        return availableOrders.filter((order) =>
            selectedAreas.includes(order.surveyLocation.district)
        );
    }, [availableOrders, selectedAreas]);

    // Memilih order pertama secara otomatis
    useEffect(() => {
        if (filteredOrders.length > 0) {
            setSelectedOrder((currentOrder) => {
                if (
                    currentOrder &&
                    filteredOrders.some(
                        (order) => order._id === currentOrder._id
                    )
                ) {
                    return currentOrder;
                }

                return filteredOrders[0];
            });
        } else {
            setSelectedOrder(null);
        }
    }, [filteredOrders]);

    // Memilih order berdasarkan ID dari dashboard
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("orderId");

        if (!orderId || availableOrders.length === 0) return;

        const targetOrder = availableOrders.find(
            (order) => order._id === orderId
        );

        if (!targetOrder) return;

        // Pastikan area order masuk ke filter
        setSelectedAreas((prev) =>
            prev.includes(targetOrder.surveyLocation.district)
                ? prev
                : [...prev, targetOrder.surveyLocation.district]
        );

        // Tampilkan detail order yang dipilih
        setSelectedOrder(targetOrder);

    }, [availableOrders]);

    // Format tanggal
    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    // Membuat inisial nama customer
    function getInitials(name?: string) {
        if (!name) return "👤";

        return (
            name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "👤"
        );
    }

    // Button handle take order
    async function handleTakeOrder() {
        if (!selectedOrder || isTakingOrder) return;

        const confirmation = await Swal.fire({
            title: "Ambil order ini?",
            text: "Pastikan kamu bersedia melakukan survei sesuai jadwal.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, ambil order",
            cancelButtonText: "Batal",
            confirmButtonColor: "#123f39",
            cancelButtonColor: "#9ca3af",
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        try {
            setIsTakingOrder(true);

            const res = await fetch(`http://localhost:3000/api/orders/${selectedOrder._id}/assign`,
                {
                    method: "POST",
                }
            );

            const result = await res.json();

            if (!res.ok) {
                await Swal.fire({
                    title: "Tidak dapat mengambil order",
                    text: result.message || "Terjadi kesalahan.",
                    icon: "warning",
                    confirmButtonColor: "#123f39",
                });

                return;
            }

            await Swal.fire({
                title: "Order berhasil diambil!",
                text: "Order sekarang menjadi tanggung jawabmu.",
                icon: "success",
                confirmButtonColor: "#123f39",
            });

            setAssignedOrdersCount((prev) => prev + 1);

            // Hapus order dari daftar tersedia
            setAvailableOrders((prev) =>
                prev.filter(
                    (order) => order._id !== selectedOrder._id
                )
            );

            // Reset detail order
            setSelectedOrder(null);

        } catch (error) {
            console.error(error);

            await Swal.fire({
                title: "Terjadi kesalahan",
                text: "Silakan coba kembali beberapa saat lagi.",
                icon: "error",
                confirmButtonColor: "#123f39",
            });
        } finally {
            setIsTakingOrder(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f4f6f2] p-4 sm:p-6 lg:p-8">
            {/* Page Heading */}
            <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#36766b]">
                        Ruang Surveyor
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold text-[#263e3a] sm:text-3xl">
                        Order tersedia
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Temukan survei di area yang kamu kenal. Pilih jadwal
                        yang cocok untukmu.
                    </p>
                </div>
            </section>

            {/* Filter Area */}
            <section className="mb-5 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <SlidersHorizontal
                        size={20}
                        className="mr-2 text-[#285d54]"
                    />

                    <span className="mr-2 text-sm font-medium text-gray-700">
                        Area
                    </span>

                    {areas.map((area) => (
                        <button
                            key={area}
                            onClick={() => toggleArea(area)}
                            className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition ${selectedAreas.includes(area)
                                ? "bg-[#e7f1ec] text-[#36766b]"
                                : "bg-gray-100 text-gray-400"
                                }`}
                        >
                            <span>•</span>
                            {area}

                            {selectedAreas.includes(area) && (
                                <Check size={12} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setSelectedAreas(areas)}
                        className="text-sm text-[#36766b] hover:underline pe-5"
                    >
                        Reset
                    </button>
                </div>
            </section>

            {/* Information: Ketentuan Pengambilan Order */}
            <section className="mb-5 rounded-xl border border-[#d2e5dc] bg-[#e7f1ec] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <ShieldCheck
                        size={22}
                        className="mt-0.5 shrink-0 text-[#285d54]"
                    />

                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-[#263e3a] sm:text-base">
                            Ketentuan pengambilan order
                        </h2>

                        <p className="mt-1 text-xs leading-relaxed text-[#538078] sm:text-sm">
                            Surveyor hanya dapat mengambil maksimal 3 order
                            dengan status ASSIGNED. Selesaikan order terlebih
                            dahulu sebelum mengambil order berikutnya.
                        </p>

                        {/* Kuota Order */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-[#c9ded5] bg-white/70 p-3">
                                <p className="text-xs text-gray-500">
                                    Order berjalan
                                </p>

                                <p className="mt-1 text-xl font-bold text-[#285d54]">
                                    {assignedOrdersCount} / {MAX_ORDERS}
                                </p>
                            </div>

                            <div className="rounded-lg border border-[#c9ded5] bg-white/70 p-3">
                                <p className="text-xs text-gray-500">
                                    Sisa kuota
                                </p>

                                <p className="mt-1 text-xl font-bold text-[#285d54]">
                                    {remainingOrders}
                                </p>
                            </div>
                        </div>

                        {/* Aturan Tanggal */}
                        <div className="mt-4 flex items-start gap-2 border-t border-[#c9ded5] pt-3">
                            <CalendarDays
                                size={16}
                                className="mt-0.5 shrink-0 text-[#36766b]"
                            />

                            <p className="text-xs leading-relaxed text-[#538078]">
                                <strong>Perhatikan jadwal:</strong> Kamu tidak
                                dapat mengambil order lain jika sudah memiliki
                                order dengan tanggal survei yang sama.
                            </p>
                        </div>

                        {/* Kuota Habis */}
                        {remainingOrders === 0 && (
                            <div className="mt-3 rounded-lg bg-[#fff4df] p-3">
                                <p className="text-xs font-medium text-amber-800">
                                    Kuota order sudah penuh. Selesaikan salah
                                    satu order terlebih dahulu untuk mengambil
                                    order baru.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Orders and Detail */}
            <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
                {/* Left: Order List */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-medium text-[#263e3a]">
                            {filteredOrders.length} order sesuai filter
                        </p>
                    </div>

                    <div className="max-h-[calc(100vh+280px)] space-y-3 overflow-y-auto pr-2">
                        {filteredOrders.length === 0 ? (
                            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                                <MapPin
                                    className="mx-auto text-gray-300"
                                    size={32}
                                />

                                <p className="mt-3 text-sm font-medium text-gray-600">
                                    Tidak ada order di area ini
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Coba pilih area lainnya.
                                </p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className={`rounded-xl border bg-white p-4 transition sm:p-5 ${selectedOrder?._id === order._id
                                        ? "border-2 border-[#285d54]"
                                        : "border-gray-200 hover:border-[#9bbeb2]"
                                        }`}
                                >
                                    {/* Order Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7f1ec] text-xs font-medium text-[#285d54]">
                                                {getInitials(order.customerName)}
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-[#263e3a]">
                                                    {order.surveyLocation.district}, {order.surveyLocation.city}
                                                </h3>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    {order.customerName} • {" "}
                                                    No.Order: {order._id}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rounded-full bg-[#e7f1ec] px-3 py-1.5 text-[10px] font-medium text-[#36766b]">
                                            • {order.status === "PAID" ? "Sudah dibayar" : ""}
                                        </span>
                                    </div>

                                    {/* Order Information */}
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-[#263e3a]">
                                            {order.kosCount} kos ·{" "}
                                            {order.serviceType === "USER_CHOICE"
                                                ? "Pilihan pengguna"
                                                : "Rekomendasi surveyor"}
                                        </p>

                                        <p className="mt-2 text-xs text-gray-400">
                                            {order.requirements?.genderPreferences === "ANY" ?
                                                "Campur" : order.requirements?.genderPreferences === "MALE" ?
                                                    "Khusus Laki-Laki" : order.requirements?.genderPreferences === "FEMALE" ?
                                                        "Khusus Perempuan" : "Tidak ditentukan"}
                                            {" · "}
                                            {formatRupiah(
                                                order.requirements?.budget?.min ?? 0
                                            )}
                                            {" - "}
                                            {formatRupiah(
                                                order.requirements?.budget?.max ?? 0
                                            )}
                                        </p>

                                        <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                            <CalendarDays size={14} />
                                            {formatDate(order.surveyDate)}
                                        </p>
                                    </div>

                                    {/* Price and Action */}
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                                        <div>
                                            <p className="text-[10px] uppercase text-gray-400">
                                                Pendapatan bersih
                                            </p>

                                            <p className="mt-1 text-xl font-semibold text-[#263e3a]">
                                                {formatRupiah(order.pricing)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-[#285d54] transition hover:bg-[#e7f1ec]"
                                        >
                                            {selectedOrder?._id === order._id ? (
                                                <>
                                                    <Check size={15} />
                                                    Detail dipilih
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowRight size={15} />
                                                    Lihat detail
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <p className="mt-4 text-xs text-gray-400">
                        Menampilkan {filteredOrders.length} order dari{" "}
                        {availableOrders.length} order yang tersedia.
                    </p>
                </div>

                {/* Right: Order Detail */}
                {selectedOrder ? (
                    <aside className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 xl:sticky xl:top-6">
                        <h2 className="text-lg font-semibold text-[#263e3a]">
                            Detail order
                        </h2>

                        {/* Order ID and Status */}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-[#263e3a]">
                                {selectedOrder._id}
                            </p>

                            <span className="rounded-full bg-[#e7f1ec] px-3 py-1.5 text-[10px] font-medium text-[#36766b]">
                                {selectedOrder.status === "PAID" ? "sudah dibayar" : "belum dibayar"}
                            </span>
                        </div>

                        {/* Customer */}
                        <div className="mt-5 flex items-center gap-3 border-b border-gray-200 pb-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7f1ec] text-sm font-medium text-[#285d54]">
                                {getInitials(selectedOrder.customerName)}
                            </div>

                            <div>
                                <p className="text-sm font-medium text-[#263e3a]">
                                    {selectedOrder.customerName}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Customer ·{" "}
                                    {selectedOrder.serviceType === "USER_CHOICE"
                                        ? "Pilihan pengguna"
                                        : "Rekomendasi surveyor"}
                                </p>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="space-y-4 border-b border-gray-200 py-5">
                            <div className="flex justify-between gap-3 text-xs">
                                <span className="text-gray-400">Lokasi</span>

                                <span className="text-right font-medium text-[#263e3a]">
                                    {selectedOrder.surveyLocation.district},{" "}
                                    {selectedOrder.surveyLocation.city}
                                </span>
                            </div>

                            <div className="flex justify-between gap-3 text-xs">
                                <span className="text-gray-400">Provinsi</span>

                                <span className="text-right font-medium text-[#263e3a]">
                                    {selectedOrder.surveyLocation.province}
                                </span>
                            </div>

                            <div className="flex justify-between gap-3 text-xs">
                                <span className="text-gray-400">Jadwal</span>

                                <span className="text-right font-medium text-[#263e3a]">
                                    {formatDate(selectedOrder.surveyDate)}
                                </span>
                            </div>

                            <div className="flex justify-between gap-3 text-xs">
                                <span className="text-gray-400">
                                    Jumlah kos
                                </span>

                                <span className="text-right font-medium text-[#263e3a]">
                                    {selectedOrder.kosCount} kos
                                </span>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="py-5">
                            <h3 className="text-sm font-medium text-[#263e3a]">
                                Kebutuhan survei
                            </h3>

                            {selectedOrder.serviceType ===
                                "SURVEYOR_RECOMENDATION" ? (
                                <div className="mt-3 space-y-3 text-xs text-gray-500">
                                    <p>
                                        <strong>Preferensi gender:</strong>{" "}
                                        {selectedOrder.requirements?.genderPreferences === "ANY" ? "Campur" : selectedOrder.requirements?.genderPreferences === "MALE" ? "Khusus Laki-Laki" : "Khusus Perempuan"}
                                    </p>

                                    <p>
                                        <strong>Budget:</strong>{" "}
                                        {formatRupiah(
                                            selectedOrder.requirements?.budget?.min ?? 0
                                        )}{" "}
                                        -{" "}
                                        {formatRupiah(
                                            selectedOrder.requirements?.budget?.max ?? 0
                                        )}
                                    </p>

                                    <div>
                                        <strong>
                                            Fasilitas yang diinginkan:
                                        </strong>

                                        {selectedOrder.requirements?.facilities?.length ? (
                                            <ul className="mt-2 list-inside list-disc space-y-1">
                                                {selectedOrder.requirements.facilities.map(
                                                    (facility, index) => (
                                                        <li key={index}>
                                                            {facility}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="mt-1">
                                                Tidak ada fasilitas khusus.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {selectedOrder.targets?.length ? (
                                        selectedOrder.targets.map(
                                            (target, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-lg bg-[#f4f6f2] p-3 text-xs"
                                                >
                                                    <p className="font-medium text-[#263e3a]">
                                                        {target.propertyName}
                                                    </p>

                                                    <p className="mt-1 text-gray-500">
                                                        {target.address}
                                                    </p>

                                                    {target.googleMapsUrls && (
                                                        <a
                                                            href={target.googleMapsUrls}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-2 inline-block text-[#36766b] hover:underline"
                                                        >
                                                            Lihat lokasi
                                                        </a>
                                                    )}

                                                    {target.ownerContact && (
                                                        <p className="mt-1 text-gray-500">
                                                            Kontak Pemilik Kos: {target.ownerContact}
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        )
                                    ) : (
                                        <p className="text-xs text-gray-400">
                                            Belum ada daftar kos dari customer.
                                        </p>
                                    )}
                                </div>
                            )}
                            <p className="mt-3 space-y-3 text-xs text-gray-500">
                                <strong>Catatan:</strong>{" "}
                                {selectedOrder.requirements?.notes || "-"}
                            </p>
                        </div>

                        {/* Price */}
                        <div className="mt-5 space-y-3 border-t border-gray-200 pt-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Pendapatan bersih
                                </span>

                                <span className="font-semibold text-[#263e3a]">
                                    {formatRupiah(selectedOrder.pricing)}
                                </span>
                            </div>
                        </div>

                        {/* Take Order */}
                        <button
                            onClick={handleTakeOrder}
                            disabled={isTakingOrder || remainingOrders === 0}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#123f39] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#205a50] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={18} />

                            {isTakingOrder
                                ? "Mengambil order..."
                                : remainingOrders === 0
                                    ? "Kuota order penuh"
                                    : "Ambil order ini"}
                        </button>

                        <p className="mt-4 text-[10px] leading-relaxed text-gray-400">
                            Dengan mengambil order, kamu berkomitmen hadir
                            sesuai jadwal dan mengirim laporan lengkap.
                        </p>
                    </aside>
                ) : (
                    <aside className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                        <UserRound
                            className="mx-auto text-gray-300"
                            size={32}
                        />

                        <p className="mt-3 text-sm font-medium text-gray-600">
                            Belum ada order dipilih
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Pilih salah satu order untuk melihat detailnya.
                        </p>
                    </aside>
                )}
            </section>
            <Footer />
        </main>
    );
}
