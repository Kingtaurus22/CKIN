/** Placeholder ringan saat parameter route sedang dibaca (dipakai di <Suspense>). */
export default function PageFallback() {
  return (
    <div className="stack" aria-busy="true" aria-label="Memuat halaman">
      <div className="skeleton" style={{ height: 14, width: 120 }} />
      <div className="skeleton" style={{ height: 34, width: "45%" }} />
      <div className="skeleton" style={{ height: 260 }} />
    </div>
  );
}
