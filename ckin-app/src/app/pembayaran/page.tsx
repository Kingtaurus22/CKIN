import { Suspense } from "react";
import { OrderShell } from "@/src/components/order/ui";
import PaymentClient from "@/src/components/order/PaymentClient";
export default function Page() {
    return (
        <OrderShell
            eyebrow="Pembayaran"
            title="Amankan jadwal surveimu."
            description="Pilih metode pembayaran yang paling nyaman untukmu."
            step={3}
        >
            <Suspense
                fallback={
                    <p className="text-sm text-[#829088]">Memuat pembayaran...</p>
                }
            >
                <PaymentClient />
            </Suspense>
        </OrderShell>
    );
}
