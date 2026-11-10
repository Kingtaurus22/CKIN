import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card empty" style={{ maxWidth: 440 }}>
        <p className="eyebrow">404</p>
        <strong>Halaman tidak ditemukan</strong>
        <p>Alamat yang kamu buka tidak tersedia atau sudah dipindahkan.</p>
        <Link className="btn btn-primary btn-sm" href="/">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
