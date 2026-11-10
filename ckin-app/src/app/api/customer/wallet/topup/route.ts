import { ObjectId } from "mongodb";
import { findAccountById } from "@/db/models/AccountModel";
import WalletModel from "@/db/models/WalletModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { ENABLED_PAYMENTS, appBaseUrl, getSnap } from "@/src/lib/midtrans";
import { TOPUP_ADMIN_FEE } from "@/src/lib/pricing";
import { topupSchema } from "@/src/schemas/order";

/**
 * POST /api/customer/wallet/topup { amount, method }
 * Membuat transaksi top up PENDING + sesi Midtrans Snap.
 * Customer membayar nominal + biaya admin; saldo bertambah sebesar nominal
 * setelah Midtrans menyatakan lunas (webhook / sinkronisasi).
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession("customer");
    const { amount, method } = topupSchema.parse(await readJson(request));
    const customerId = new ObjectId(session.sub);

    const pending = await WalletModel.collection().countDocuments({
      customerId,
      category: "topup",
      status: "PENDING",
      createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
    });
    if (pending >= 3) {
      throw new ApiError(409, "Masih ada 3 top up yang belum dibayar. Selesaikan atau tunggu kedaluwarsa terlebih dahulu.");
    }

    const trx = await WalletModel.createTopup(customerId, amount, TOPUP_ADMIN_FEE, method);
    const account = await findAccountById("customer", session.sub);

    try {
      const transaction = await getSnap().createTransaction({
        transaction_details: { order_id: trx.midtransOrderId, gross_amount: amount + TOPUP_ADMIN_FEE },
        item_details: [
          { id: "TOPUP", price: amount, quantity: 1, name: "Top up Saldo CKIN" },
          { id: "ADMIN_FEE", price: TOPUP_ADMIN_FEE, quantity: 1, name: "Biaya admin top up" },
        ],
        customer_details: account
          ? { first_name: account.fullname, email: account.email, phone: account.phone }
          : undefined,
        enabled_payments: ENABLED_PAYMENTS[method],
        expiry: { unit: "hours", duration: 24 },
        callbacks: { finish: `${appBaseUrl(request)}/customer/wallet?topup=${trx._id.toString()}` },
      });
      await WalletModel.saveTopupSession(trx._id, {
        redirectUrl: transaction.redirect_url,
        snapToken: transaction.token,
      });
      return ok({ id: trx._id.toString(), redirectUrl: transaction.redirect_url, snapToken: transaction.token }, 201);
    } catch (error) {
      await WalletModel.collection().updateOne({ _id: trx._id }, { $set: { status: "FAILED", updatedAt: new Date() } });
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("MIDTRANS_")) {
      return handleApiError(new ApiError(500, "Pembayaran Midtrans belum dikonfigurasi di server."), "wallet-topup");
    }
    return handleApiError(error, "wallet-topup");
  }
}
