import { ObjectId } from "mongodb";
import { errorHandler } from "@/db/helpers/errorHandler";
import OrdersModel from "@/db/models/OrdersModel";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!ObjectId.isValid(id)) {
            return Response.json(
                { message: "ID surveyor tidak valid." },
                { status: 400 }
            );
        }

        const orders = await OrdersModel.getOrderBySurveyorId(
            new ObjectId(id)
        );

        const assignedOrders = orders.filter(
            (order) => order.assignmentStatus === "ASSIGNED"
        );

        return Response.json(assignedOrders);

    } catch (error) {
        return errorHandler(error);
    }
}