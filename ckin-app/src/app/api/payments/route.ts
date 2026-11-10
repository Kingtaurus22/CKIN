import { ObjectId } from "mongodb";
import { findAccountById } from "@/db/models/AccountModel";
import OrderModel, { orderCode, toObjectId } from "@/db/models/OrderModel";
import WalletModel from "@/db/models/WalletModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { ENABLED_PAYMENTS, appBaseUrl, getSnap } from "@/src/lib/midtrans";
import { toCanonicalStatus } from "@/src/lib/order-status";
import { PRICE_PER_KOS, SERVICE_FEE } from "@/src/lib/pricing";
import { createPaymentSchema } from "@/src/schemas/order";

/**
 * POST /api/payments  { orderId, method }
 * - method "saldo"  → langsung dipotong dari Saldo CKIN, pesanan lunas.
 * - method lain     → membuat sesi Midtrans Snap, client diarahkan ke redirectUrl.
 *   Status lunas dikirim Midtrans ke /api/payments/notification.
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession("customer");
    const { orderId, method } = createPaymentSchema.parse(await readJson(request));
    const customerId = new ObjectId(session.sub);

    await OrderModel.expireOverdue(customerId);
    const id = toObjectId(orderId);
    const order = id ? await OrderModel.findOwnedByCustomer(id, customerId) : null;
    if (!order) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const status = toCanonicalStatus(order.status);
    if (status === "EXPIRED") throw new ApiError(409, "Batas waktu pembayaran sudah lewat. Silakan buat pesanan baru.");
    if (status === "CANCELLED") throw new ApiError(409, "Pesanan sudah dibatalkan.");
    if (status !== "PENDING_PAYMENT") throw new ApiError(409, "Pesanan ini sudah dibayar.");

    const total = typeof order.pricing === "number" ? order.pricing : (order.pricing?.total ?? 0);
    if (!Number.isInteger(total) || total <= 0) throw new ApiError(400, "Nominal pembayaran tidak valid.");

    // --- Saldo CKIN ---------------------------------------------------
    if (method === "saldo") {
      const { balance } = await WalletModel.balanceFor(customerId);
      const result = await OrderModel.payWithWallet(order, balance);
      if (!result.success) {
        throw new ApiError(
          409,
          result.reason === "INSUFFICIENT_BALANCE"
            ? "Saldo CKIN tidak cukup. Pilih metode lain atau top up saldo."
            : "Pesanan tidak dapat dibayar.",
        );
      }
      return ok({ paid: true });
    }

    // --- Midtrans Snap ------------------------------------------------
    // Pakai ulang sesi yang masih menunggu untuk metode yang sama.
    if (
      order.payment?.paymentStatus === "PENDING" &&
      order.payment.redirectUrl &&
      order.payment.method === method
    ) {
      return ok({ paid: false, redirectUrl: order.payment.redirectUrl, snapToken: order.payment.snapToken });
    }

    const account = await findAccountById("customer", session.sub);
    const midtransOrderId = `CKIN-${order._id.toString()}-${Date.now()}`;
    const minutesLeft = order.expiresAt
      ? Math.max(15, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 60000))
      : 24 * 60;

    const transaction = await getSnap().createTransaction({
      transaction_details: { order_id: midtransOrderId, gross_amount: total },
      item_details: [
        { id: "SURVEY", price: PRICE_PER_KOS, quantity: order.kosCount, name: `Survei kos #${orderCode(order)}` },
        { id: "SERVICE_FEE", price: SERVICE_FEE, quantity: 1, name: "Biaya layanan CKIN" },
      ],
      customer_details: account
        ? { first_name: account.fullname, email: account.email, phone: account.phone }
        : undefined,
      enabled_payments: ENABLED_PAYMENTS[method],
      expiry: { unit: "minutes", duration: minutesLeft },
      callbacks: { finish: `${appBaseUrl(request)}/customer/payment/finish` },
    });

    await OrderModel.saveMidtransSession(order._id, {
      midtransOrderId,
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url,
      method,
    });

    return ok({ paid: false, redirectUrl: transaction.redirect_url, snapToken: transaction.token }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("MIDTRANS_")) {
      return handleApiError(new ApiError(500, "Pembayaran Midtrans belum dikonfigurasi di server."), "payments");
    }
    return handleApiError(error, "payments");
  }
}
