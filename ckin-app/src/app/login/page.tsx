"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginSchema } from "../../schemas/loginSchema";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const validation = loginSchema.safeParse({
      email,
      password,
    });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Email atau kata sandi tidak valid.");
        return;
      }

      const user = result.user;

      console.log("Login berhasil:", user);

      switch (user.role) {
        case "customer":
          router.push("/");
          break;

        case "surveyor":
          router.push("/surveyor");
          break;

        case "admin":
          router.push("/admin");
          break;

        case "staff":
          router.push("/staff");
          break;

        default:
          setError("Role akun tidak dikenali.");
      }

    } catch {
      setError("Terjadi kesalahan. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }

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

        {/* Panel kanan: Login */}
        <section className="flex items-center justify-center p-5 sm:p-8 lg:p-8">
          <div className="w-full max-w-lg">

            {/* Heading */}
            <p className="text-xs uppercase tracking-wider text-teal-700">
              Selamat datang kembali
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-800 sm:text-2xl">
              Masuk ke akun CKIN.
            </h2>

            <p className="mt-1.5 text-xs text-gray-500 sm:text-sm">
              Masukkan email dan kata sandi untuk melanjutkan.
            </p>

            {/* Form Login */}
            <form
              onSubmit={handleLogin}
              className="mt-5 space-y-3 sm:mt-6 sm:space-y-4"
            >

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
                  type="text"
                  name="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 sm:px-4 sm:py-2.5"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 sm:px-4 sm:py-2.5"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-teal-800 hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>

              {/* Login error */}
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-teal-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm"
              >
                {loading ? "Memeriksa akun..." : "Masuk"}
              </button>

              {/* Register */}
              <div className="mt-4 text-center text-[10px] text-gray-500 sm:mt-5 sm:text-xs">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-medium text-teal-800 hover:underline"
                >
                  Daftar sebagai pengguna
                </Link>
              </div>

              {/* Surveyor Register */}
              <div className="mt-2 text-center text-[10px] text-gray-500 sm:text-xs">
                Ingin bergabung sebagai surveyor?{" "}
                <Link
                  href="/register-surveyor"
                  className="font-medium text-teal-800 hover:underline"
                >
                  Daftar surveyor
                </Link>
              </div>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between text-[9px] text-gray-400 sm:mt-6 sm:text-[10px]">
                <span>© 2026 CKIN</span>

                <span>
                  Privasi · Syarat & Ketentuan
                </span>
              </div>

            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
