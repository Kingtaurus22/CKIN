import type { ReactNode } from "react";
export function OrderShell({
    eyebrow,
    title,
    description,
    step,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    step: number;
    children: ReactNode;
}) {
    const steps = [
        "Lokasi & surveyor",
        "Pilihan kos",
        "Jadwal survei",
        "Konfirmasi",
    ];
    return (
        <main className="min-h-screen bg-[#f5f7f3] px-4 py-7 text-[#203b38] sm:px-7 lg:px-10">
            <div className="mx-auto max-w-[1180px]">
                <header className="mb-6">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#347b70]">
                        {eyebrow}
                    </p>
                    <h1 className="text-2xl font-medium sm:text-[30px]">{title}</h1>
                    <p className="mt-2 text-sm text-[#7b8983]">{description}</p>
                </header>
                <nav
                    aria-label="Progress pesanan"
                    className="mb-6 rounded-xl border border-[#e0e7df] bg-white px-4 py-4 sm:px-6"
                >
                    <ol className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-2">
                        {steps.map((s, i) => (
                            <li key={s} className="flex min-w-0 items-center gap-2">
                                <span
                                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${i <= step ? "bg-[#123f3a] text-white" : "bg-[#f1f4ef] text-[#83918a]"}`}
                                >
                                    {i < step ? "✓" : String(i + 1).padStart(2, "0")}
                                </span>
                                <span
                                    className={`truncate text-xs ${i === step ? "font-medium text-[#164943]" : "text-[#87938d]"}`}
                                >
                                    {s}
                                </span>
                                {i < 3 && (
                                    <span className="ml-1 hidden h-px min-w-3 flex-1 bg-[#e2e8e1] sm:block" />
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
                {children}
                <footer className="mt-10 flex flex-col gap-2 border-t border-[#e5ebe3] pt-4 text-[10px] text-[#8a9790] sm:flex-row sm:justify-between">
                    <span>CKIN — cek dulu, baru pindah.</span>
                    <span>Pusat bantuan　·　Syarat & ketentuan　·　Privasi</span>
                </footer>
            </div>
        </main>
    );
}
export function Panel({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-xl border border-[#e0e7df] bg-white p-5 sm:p-6 ${className}`}
        >
            {children}
        </section>
    );
}
export function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-medium">{label}</span>
            {children}
        </label>
    );
}
export const inputClass =
    "h-11 w-full rounded-lg border border-[#dce5dc] bg-white px-3 text-sm outline-none focus:border-[#286d62] focus:ring-2 focus:ring-[#286d62]/10";
export const primaryButton =
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#123f3a] px-5 text-xs font-semibold text-white hover:bg-[#1b554d] disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#dfe7de] bg-white px-5 text-xs font-semibold text-[#174740]";
