import { Headphones } from "lucide-react";

export default function Footer() {
    return (
        <footer className="mt-7 flex flex-col justify-between gap-3 text-xs text-gray-400 sm:flex-row">
            <div className="flex items-center gap-2">
                <Headphones size={15} />
                © 2026 CKIN — cek dulu, baru pindah.
            </div>

            <p>
                <a href="">Pusat Bantuan</a> • {" "}
                <a href="">Syarat & Ketentuan</a> • {" "}
                <a href="">Privasi</a>
            </p>
        </footer>
    );
}
