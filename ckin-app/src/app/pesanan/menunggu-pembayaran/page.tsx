import { OrderShell } from "@/src/components/order/ui";
import ReviewOrder from "@/src/components/order/ReviewOrder";
export default function Page() {
    return (
        <OrderShell
            eyebrow="Konfirmasi pesanan"
            title="Periksa pesananmu."
            description="Pastikan seluruh informasi sudah benar sebelum membuat pesanan."
            step={3}
        >
            <ReviewOrder />
        </OrderShell>
    );
}
