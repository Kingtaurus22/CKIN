import PaymentClient from "@/src/components/order/PaymentClient";
import { OrderShell } from "@/src/components/order/ui";

interface PageProps {
    params: Promise<{
        orderId: string;
    }>;
}

export const instant = false

export default async function PaymentPage({ params }: PageProps) {
    const { orderId } = await params;

    return (
        <OrderShell
            eyebrow="Pembayaran"
            title="Amankan jadwal surveimu."
            description="Pilih metode pembayaran yang paling nyaman untukmu."
            step={3}
        >
            <PaymentClient orderId={orderId} />
        </OrderShell>
    );
}