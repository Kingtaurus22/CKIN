import { OrderShell } from "@/src/components/order/ui";
import KosTargetsForm from "@/src/components/order/KosTargetsForm";
export default function Page() {
    return (
        <OrderShell
            eyebrow="Kos pilihan sendiri"
            title="Masukkan kos incaranmu."
            description="Berikan detail kos yang ingin dikunjungi surveyor."
            step={1}
        >
            <KosTargetsForm />
        </OrderShell>
    );
}
