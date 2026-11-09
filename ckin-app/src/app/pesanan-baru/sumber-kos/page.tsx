import { OrderShell } from "@/src/components/order/ui";
import SourceSelection from "@/src/components/order/SourceSelection";
export default function Page() {
    return (
        <OrderShell
            eyebrow="Pesanan baru"
            title="Sudah punya kos incaran?"
            description="Tentukan cara mencari kos yang akan disurvei."
            step={1}
        >
            <SourceSelection />
        </OrderShell>
    );
}
