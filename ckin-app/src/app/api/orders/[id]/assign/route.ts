import { errorHandler } from "@/db/helpers/errorHandler";
import OrdersModel from "@/db/models/OrdersModel";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const surveyorId = "6aef49fcd6d282d09954efd9";

        const result = await OrdersModel.assignOrder(
            id,
            surveyorId
        );

        return Response.json(result, { status: 200 });

    } catch (error) {
        return errorHandler(error);
    }
}
