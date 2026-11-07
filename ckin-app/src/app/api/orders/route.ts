import OrdersModel from "@/db/models/OrdersModel";

export async function GET() {
    const orders = await OrdersModel.getAllOrders();
    return Response.json(orders);
}