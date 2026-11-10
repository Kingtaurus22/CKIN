import { ObjectId } from "mongodb";
import { z } from "zod";
import { toObjectId } from "@/db/models/OrderModel";
import WalletModel from "@/db/models/WalletModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { getSnap } from "@/src/lib/midtrans";
import { applyTopupStatus } from "@/src/lib/payment-sync";

const schema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i, "ID transaksi tidak valid") });

/**
 * POST /api/customer/wallet/topup/sync { id }
 * Cek status top up langsung ke Midtrans (dipakai setelah kembali dari Snap,
 * terutama di localhost yang tidak bisa menerima webhook).
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession("customer");
    const { id } = schema.parse(await readJson(request));
    const trxId = toObjectId(id);
    const trx = trxId ? await WalletModel.findTopup(trxId, new ObjectId(session.sub)) : null;
    if (!trx) throw new ApiError(404, "Transaksi top up tidak ditemukan.");
    if (trx.status !== "PENDING" || !trx.midtransOrderId) return ok({ status: trx.status });

    try {
      await applyTopupStatus(await getSnap().transaction.status(trx.midtransOrderId));
    } catch {
      // 404 dari Midtrans: customer belum memilih metode pembayaran.
    }
    const latest = await WalletModel.findTopup(trx._id, trx.customerId);
    return ok({ status: latest?.status ?? trx.status });
  } catch (error) {
    return handleApiError(error, "wallet-topup-sync");
  }
}
