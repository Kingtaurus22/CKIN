"use client";

/**
 * Helper fetch untuk komponen client.
 * Semua API CKIN membalas `{ success, data }` atau `{ success: false, message }`.
 */
export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "same-origin",
      ...init,
      headers: {
        ...(init.body && !isForm ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ClientApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi internetmu.");
  }

  let payload: { success?: boolean; data?: T; message?: string } = {};
  try {
    payload = await response.json();
  } catch {
    // Response bukan JSON (mis. error 500 dari server).
  }

  if (!response.ok || payload.success === false) {
    // Sesi berakhir → arahkan ke login (kecuali saat memang sedang login).
    if (response.status === 401 && !url.startsWith("/api/auth/") && typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }
    throw new ClientApiError(
      response.status,
      payload.message || "Terjadi kesalahan. Silakan coba lagi.",
    );
  }

  return payload.data as T;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
}
