import snap from "@/src/lib/midtrans";
import OrdersModel from "@/db/models/OrdersModel";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify notification with Midtrans.
    const notification = await (
      snap as unknown as {
        transaction: {
          notification: (body: unknown) => Promise<any>;
        };
      }
    ).transaction.notification(body);

    const {
      order_id,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
      gross_amount,
    } = notification;

    // Find the corresponding order.
    const order = await OrdersModel.collection().findOne({
      "payment.midtransOrderId": order_id,
    });

    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    // Verify payment amount.
    if (Number(gross_amount) !== order.pricing) {
      return Response.json(
        { message: "Payment amount mismatch" },
        { status: 400 },
      );
    }

    // Never downgrade an already-paid order.
    if (order.payment?.paymentStatus === "PAID") {
      return Response.json({
        message: "Payment already processed",
      });
    }

    const isPaymentSuccess =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    let paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "EXPIRED" =
      "PENDING";

    let orderStatus: "PENDING_PAYMENT" | "PAID" = "PENDING_PAYMENT";

    if (isPaymentSuccess) {
      paymentStatus = "PAID";
      orderStatus = "PAID";
    } else if (transaction_status === "pending") {
      paymentStatus = "PENDING";
    } else if (transaction_status === "expire") {
      paymentStatus = "EXPIRED";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel"
    ) {
      paymentStatus = "FAILED";
    }

    await OrdersModel.updatePaymentByMidtransOrderId(
      order_id,
      {
        paymentStatus,
        transactionId: transaction_id,
        paymentType: payment_type,
      },
      orderStatus,
      isPaymentSuccess ? new Date() : undefined,
    );

    return Response.json({
      message: "Notification processed successfully",
    });
  } catch (error) {
    console.error("MIDTRANS NOTIFICATION ERROR:", error);

    return Response.json(
      { message: "Failed to process notification" },
      { status: 500 },
    );
  }
}
