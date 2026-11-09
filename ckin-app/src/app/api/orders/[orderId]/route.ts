import OrdersModel, { OrderType } from "@/db/models/OrdersModel";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } },
) {
  try {
    const { orderId } = await params;
    console.log(`GET ORDER: `, orderId);
    const order = await OrdersModel.getOrderById(orderId);
    if (!order) {
      return Response.json({ message: `Order not found` }, { status: 404 });
    }

    // TODO
    const UserId = "6aef496fd6d282d09954efd2";

    if (order.UserId.toString() !== UserId) {
      return Response.json({ message: `Unauthorized` }, { status: 401 });
    }

    return Response.json({
      message: `Order fetch successfully`,
      data: order,
    });
  } catch (error) {
    console.error(`GET ORDER ERROR: `, error);
    return Response.json({ message: `Internal Server Error` }, { status: 500 });
  }
}
