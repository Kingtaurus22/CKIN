import { ObjectId } from "mongodb";
import { z } from "zod";
import OrderModel, { toObjectId } from "@/db/models/OrderModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { getSnap } from "@/src/lib/midtrans";
import { toCanonicalStatus } from "@/src/lib/order-status";
import { applyMidtransStatus } from "@/src/lib/payment-sync";

const schema = z.object({ orderId: z.string().regex(/^[a-f0-9]{24}$/i, "ID pesanan tidak valid") });

/**
 * POST /api/payments/sync { orderId }
 * Tanyakan status transaksi terakhir pesanan ini langsung ke Midtrans lalu
 * perbarui pesanan. Membuat status lunas tetap terbarui walau webhook belum
 * terpasang (mis. saat development di localhost).
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession("customer");
    const { orderId } = schema.parse(await readJson(request));

    const id = toObjectId(orderId);
    const order = id ? await OrderModel.findOwnedByCustomer(id, new ObjectId(session.sub)) : null;
    if (!order) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const midtransOrderId = order.payment?.midtransOrderId;
    if (toCanonicalStatus(order.status) !== "PENDING_PAYMENT" || !midtransOrderId) {
      return ok({ changed: false, status: order.status });
    }

    let status;
    try {
      status = await getSnap().transaction.status(midtransOrderId);
    } catch {
      // Midtrans membalas 404 bila customer belum memilih metode di Snap.
      return ok({ changed: false, status: order.status });
    }

    const result = await applyMidtransStatus(status);
    return ok({ changed: result.ok && result.paid, status: result.ok ? result.status : order.status });
  } catch (error) {
    return handleApiError(error, "payments-sync");
  }
}
