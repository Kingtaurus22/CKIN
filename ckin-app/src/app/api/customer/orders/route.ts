import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import OrderModel from "@/db/models/OrderModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import type { OrderFilter } from "@/src/lib/order-status";

const FILTERS: OrderFilter[] = ["all", "active", "completed", "other"];

/**
 * GET /api/customer/orders?status=all|active|completed|other&q=kata
 * Daftar pesanan milik customer yang sedang login + jumlah per tab.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession("customer");
    const customerId = new ObjectId(session.sub);
    await OrderModel.expireOverdue(customerId);

    const statusParam = request.nextUrl.searchParams.get("status") as OrderFilter | null;
    const filter = statusParam && FILTERS.includes(statusParam) ? statusParam : "all";
    const search = request.nextUrl.searchParams.get("q")?.trim().slice(0, 60) || undefined;

    const [orders, counts] = await Promise.all([
      OrderModel.listForCustomer(customerId, { filter, search }),
      OrderModel.countsForCustomer(customerId),
    ]);

    return ok({ orders, counts });
  } catch (error) {
    return handleApiError(error, "customer-orders");
  }
}
