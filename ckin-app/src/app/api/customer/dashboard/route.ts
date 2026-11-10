import { ObjectId } from "mongodb";
import OrderModel from "@/db/models/OrderModel";
import WalletModel from "@/db/models/WalletModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import type { CustomerDashboardData } from "@/src/types/customer";

/** GET /api/customer/dashboard — ringkasan untuk dashboard customer. */
export async function GET() {
  try {
    const session = await requireSession("customer");
    const customerId = new ObjectId(session.sub);
    await OrderModel.expireOverdue(customerId);

    const [counts, wallet, recentOrders] = await Promise.all([
      OrderModel.countsForCustomer(customerId),
      WalletModel.balanceFor(customerId),
      OrderModel.listForCustomer(customerId, { limit: 5 }),
    ]);

    const data: CustomerDashboardData = {
      counts,
      walletBalance: wallet.balance,
      recentOrders,
    };
    return ok(data);
  } catch (error) {
    return handleApiError(error, "customer-dashboard");
  }
}
