import { OrderShell } from "@/src/components/order/ui";
import ScheduleForm from "@/src/components/order/ScheduleForm";
export default function Page() {
    return (
        <OrderShell
            eyebrow="Jadwal survei"
            title="Pilih waktu yang pas."
            description="Jadwalkan survei minimal 7 hari sebelum tanggal rencana masuk kos."
            step={2}
        >
            <ScheduleForm />
        </OrderShell>
    );
}
