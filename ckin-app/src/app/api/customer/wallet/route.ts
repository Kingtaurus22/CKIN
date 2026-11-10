import { ObjectId } from "mongodb";
import WalletModel from "@/db/models/WalletModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** GET /api/customer/wallet — saldo CKIN dan riwayat transaksi customer. */
export async function GET() {
  try {
    const session = await requireSession("customer");
    return ok(await WalletModel.viewFor(new ObjectId(session.sub)));
  } catch (error) {
    return handleApiError(error, "customer-wallet");
  }
}
