import { OrderShell } from "@/src/components/order/ui";
import PreferenceForm from "@/src/components/order/PreferenceForm";
export default function Page() {
    return (
        <OrderShell
            eyebrow="Rekomendasi surveyor"
            title="Kos seperti apa yang kamu cari?"
            description="Bantu surveyor merekomendasikan kos yang sesuai dengan kebutuhanmu."
            step={1}
        >
            <PreferenceForm />
        </OrderShell>
    );
}
