/**
 * JWT HS256 sederhana berbasis Web Crypto.
 * Tidak butuh dependency tambahan dan bisa dipakai di proxy (route guard)
 * maupun di route handler API.
 */

export type UserRole = "customer" | "surveyor";
/** Role sesi termasuk super admin (koleksi `admins`). */
export type AppRole = UserRole | "admin";

export type SessionPayload = {
  sub: string; // _id akun (customers._id, surveyors._id, atau admins._id)
  role: AppRole;
  name: string;
  email: string;
  iat: number;
  exp: number;
};

export const SESSION_COOKIE = "ckin_session";
export const SESSION_TTL_SHORT = 60 * 60 * 24; // 1 hari (tanpa "Ingat saya")
export const SESSION_TTL_LONG = 60 * 60 * 24 * 30; // 30 hari ("Ingat saya")

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET belum diatur atau terlalu pendek (minimal 16 karakter).",
    );
  }

  return secret;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(
  data: Omit<SessionPayload, "iat" | "exp">,
  ttlSeconds: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { ...data, iat: now, exp: now + ttlSeconds };

  const header = base64UrlEncode(
    encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    encoder.encode(`${header}.${body}`),
  );

  return `${header}.${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;

    const decodedHeader = JSON.parse(decoder.decode(base64UrlDecode(header)));
    if (decodedHeader.alg !== "HS256") return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      base64UrlDecode(signature) as BufferSource,
      encoder.encode(`${header}.${body}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      decoder.decode(base64UrlDecode(body)),
    ) as SessionPayload;

    if (!payload.sub || !["customer", "surveyor", "admin"].includes(payload.role)) {
      return null;
    }

    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function homePathFor(role: AppRole): string {
  if (role === "admin") return "/admin";
  return role === "surveyor" ? "/surveyor" : "/customer";
}
