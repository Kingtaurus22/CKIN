import { OrderShell } from "@/src/components/order/ui";
import LocationForm from "@/src/components/order/LocationForm";
export default function Page() {
    return (
        <OrderShell
            eyebrow="Pesanan baru"
            title="Mau cari kos di mana?"
            description="Pilih area tujuan dan tentukan jumlah kos yang ingin disurvei."
            step={0}
        >
            <LocationForm />
        </OrderShell>
    );
}
