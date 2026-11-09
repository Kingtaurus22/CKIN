import { ObjectId } from "mongodb";

import OrdersModel from "@/db/models/OrdersModel";
import snap from "@/src/lib/midtrans";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!ObjectId.isValid(orderId)) {
      return Response.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const order = await OrdersModel.getOrderById(orderId);

    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    // TODO: Replace with authenticated user's ID.
    const UserId = "6aef496fd6d282d09954efd2";

    if (order.UserId.toString() !== UserId) {
      return Response.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (order.status === "PAID") {
      return Response.json({ message: "Order already paid" }, { status: 400 });
    }

    if (order.status === "CANCELLED") {
      return Response.json(
        { message: "Order has been cancelled" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(order.pricing) || order.pricing <= 0) {
      return Response.json(
        { message: "Invalid payment amount" },
        { status: 400 },
      );
    }

    // Reuse an existing pending payment session.
    if (
      order.payment?.paymentStatus === "PENDING" &&
      order.payment.redirectUrl
    ) {
      return Response.json({
        message: "Payment session already exists",
        data: {
          redirectUrl: order.payment.redirectUrl,
          snapToken: order.payment.snapToken,
        },
      });
    }

    const midtransOrderId = `CKIN-${orderId}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: order.pricing,
      },

      item_details: [
        {
          id: "BASIC_SURVEY",
          price: 75000,
          quantity: order.kosCount,
          name: "CKIN Survey Service",
        },
        {
          id: "SERVICE_CHARGE",
          price: 5000,
          quantity: 1,
          name: "CKIN Service Charge",
        },
      ],

      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/finish`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    await OrdersModel.updatePayment(orderId, {
      provider: "MIDTRANS",
      midtransOrderId,
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url,
      paymentStatus: "PENDING",
    });

    return Response.json(
      {
        message: "Payment created successfully",
        data: {
          snapToken: transaction.token,
          redirectUrl: transaction.redirect_url,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);

    return Response.json(
      { message: "Failed to create payment" },
      { status: 500 },
    );
  }
}
