
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-2">

        {/* Panel kiri: Branding CKIN */}
        <section className="relative min-h-[320px] overflow-hidden rounded-2xl sm:min-h-[400px] lg:min-h-0">
          <Image
            src="/ckin-hero.png"
            alt="Suasana kos yang nyaman"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
            className="object-cover object-[80%_center]"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-teal-950/95 via-teal-950/40 to-transparent" />

          {/* Logo */}
          <div className="absolute left-5 top-5 sm:left-6 sm:top-6">
            <Image
              src="/ckin-logo.png"
              alt="CKIN Cari Kost"
              width={200}
              height={100}
              className="h-auto w-32 object-contain sm:w-40"
            />
          </div>

          {/* Branding */}
          <div className="absolute bottom-5 left-5 right-5 text-white sm:bottom-8 sm:left-6 sm:right-6">
            <p className="mb-2 text-[10px] uppercase tracking-wider sm:mb-3 sm:text-xs">
              Kenal kosnya, tenang pindahnya
            </p>

            <h1 className="max-w-md text-2xl font-bold leading-tight sm:text-3xl">
              Kos yang tepat, tanpa harus datang duluan.
            </h1>

            <p className="mt-3 max-w-md text-xs leading-relaxed text-white/80 sm:mt-4 sm:text-sm">
              Tim kami akan bantu cek kondisi, fasilitas, dan
              lingkungan kos. Kamu tinggal pilih dengan yakin.
            </p>
          </div>
        </section>

        {/* Panel kanan: Registrasi */}
        <section className="flex items-center justify-center p-5 sm:p-8 lg:p-8">
          <div className="w-full max-w-lg">

            {/* Heading */}
            <p className="text-xs uppercase tracking-wider text-teal-700">
              Mulai dari sini
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-800 sm:text-2xl">
              Daftar sebagai customer.
            </h2>

            <p className="mt-1.5 text-xs text-gray-500 sm:text-sm">
              Isi data berikut untuk membuat akun customer CKIN.
            </p>


            {/* Pilihan role */}
            <div className="mt-3">

              <div className="grid grid-cols-2 gap-2.5">

                {/* Pengguna - Active */}
                <div className="rounded-xl border border-teal-800 bg-teal-50/70 p-3">
                  <div className="flex items-center justify-between">

                    {/* Home Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-teal-900"
                    >
                      <path d="m3 10 9-7 9 7" />
                      <path d="M5 9v12h14V9" />
                      <path d="M9 21v-8h6v8" />
                    </svg>

                    {/* Active Indicator */}
                    <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full border border-teal-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-900" />
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-medium text-gray-800">
                    Pengguna
                  </h3>

                  <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                    Cari & survei kos
                  </p>
                </div>

                {/* Surveyor - Inactive */}
                <Link
                  href="/register-surveyor"
                  className="rounded-xl border border-gray-200 bg-white p-3 transition hover:border-teal-800 hover:bg-teal-50/50"
                >
                  <div className="flex items-center justify-between">

                    {/* Surveyor Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-teal-900"
                    >
                      <circle cx="12" cy="8" r="3" />
                      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
                      <path d="M19 8h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
                      <path d="M5 8H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
                    </svg>

                    {/* Inactive Indicator */}
                    <span className="h-2.5 w-2.5 rounded-full border border-gray-300" />
                  </div>

                  <h3 className="mt-2 text-sm font-medium text-gray-800">
                    Surveyor
                  </h3>

                  <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                    Bantu survei, dapat penghasilan
                  </p>
                </Link>

              </div>
            </div>


            {/* Form registrasi */}
            <form className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">

              {/* Nama lengkap */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm"
                >
                  Nama lengkap
                </label>

                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 sm:px-4 sm:py-2.5"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 sm:px-4 sm:py-2.5"
                />
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm"
                >
                  Nomor WhatsApp
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="+62 812 3456 7890"
                  autoComplete="tel"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 sm:px-4 sm:py-2.5"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm"
                >
                  Kata sandi
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Masukkan kata sandi"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 sm:px-4 sm:py-2.5"
                />

                <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
                  Minimal 8 karakter, gabungkan huruf dan angka.
                </p>
              </div>

              {/* Persetujuan */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  id="agreement"
                  type="checkbox"
                  name="agreement"
                  className="mt-0.5 accent-teal-800"
                />

                <label
                  htmlFor="agreement"
                  className="text-[10px] leading-relaxed text-gray-600 sm:text-xs"
                >
                  Saya menyetujui Syarat & Ketentuan dan
                  Kebijakan Privasi CKIN.
                </label>
              </div>

              {/* Tombol daftar */}
              <button
                type="submit"
                className="w-full rounded-lg bg-teal-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-teal-800 sm:py-3 sm:text-sm"
              >
                Buat akun pengguna
              </button>

            </form>

            {/* Login */}
            <div className="mt-3 text-center text-[10px] text-gray-500 sm:mt-4 sm:text-xs">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-medium text-teal-800 hover:underline"
              >
                Masuk di sini
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between text-[9px] text-gray-400 sm:mt-6 sm:text-[10px]">
              <span>© 2026 CKIN</span>

              <span>
                Privasi · Syarat & Ketentuan
              </span>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
