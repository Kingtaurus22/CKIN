import { getSnap } from "@/src/lib/midtrans";
import { applyMidtransStatus } from "@/src/lib/payment-sync";

/**
 * POST /api/payments/notification — webhook Midtrans (Payment Notification URL).
 * Atur di dashboard Midtrans: https://<domain>/api/payments/notification
 *
 * Isi notifikasi tidak dipercaya mentah-mentah: status diambil ulang dari
 * server Midtrans lewat snap.transaction.notification().
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notification = await getSnap().transaction.notification(body);
    const result = await applyMidtransStatus(notification);

    if (!result.ok) {
      return Response.json(
        { message: result.reason === "NOT_FOUND" ? "Order not found" : "Payment amount mismatch" },
        { status: result.reason === "NOT_FOUND" ? 404 : 400 },
      );
    }
    return Response.json({ message: "OK" });
  } catch (error) {
    console.error("[midtrans] notification error:", error);
    return Response.json({ message: "Failed to process notification" }, { status: 500 });
  }
}
