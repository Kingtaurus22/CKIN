/**
 * Logo CKIN: ikon rumah dengan tanda centang ("cek dulu, baru pindah")
 * + wordmark. Berbasis SVG & CSS sehingga tajam di semua ukuran dan
 * mengikuti tema terang/gelap (tanpa latar putih).
 */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="40" height="40" rx="11" fill="#DCE987" />
      <path
        d="M9.5 19.2 20 10.5l10.5 8.7V29a1.8 1.8 0 0 1-1.8 1.8H11.3A1.8 1.8 0 0 1 9.5 29v-9.8Z"
        fill="#133F37"
      />
      <path d="m15.4 21.6 3.3 3.3 6.1-6.3" stroke="#DCE987" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30.5" cy="10.5" r="3.2" fill="#2F7A69" />
    </svg>
  );
}

export default function Logo({
  size = 36,
  tagline = true,
  className = "",
}: {
  size?: number;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <span className={`brand ${className}`}>
      <LogoMark size={size} />
      <span className="brand-text">
        <strong>CKIN</strong>
        {tagline && <small>Cari Kost</small>}
      </span>
    </span>
  );
}
