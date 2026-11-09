import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

type CustomerTokenPayload = {
  sub: string;
  role: string;
  exp?: number;
};

export function verifyCustomerToken(
  request: NextRequest,
): CustomerTokenPayload | null {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    const token = authorization.slice(7).trim();
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;

    const decodedHeader = JSON.parse(
      Buffer.from(header, "base64url").toString("utf8"),
    );

    if (decodedHeader.alg !== "HS256") {
      return null;
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest();

    const receivedSignature = Buffer.from(signature, "base64url");

    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      return null;
    }

    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as CustomerTokenPayload;

    if (!decodedPayload.sub || decodedPayload.role !== "customer") {
      return null;
    }

    if (
      decodedPayload.exp &&
      decodedPayload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return decodedPayload;
  } catch {
    return null;
  }
}
