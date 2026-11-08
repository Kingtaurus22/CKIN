import { errorHandler } from "@/db/helpers/errorHandler";
import OrdersModel from "@/db/models/OrdersModel";
import SurveyorModel from "@/db/models/SurveyorModel";

export async function GET() {
    try {
        const surveyor = await SurveyorModel.getSurveyorById("6aef49fcd6d282d09954efd9")

        if (!surveyor) {
            return Response.json({ error: "Surveyor not found" }, { status: 404 });
        }

        const orders = await OrdersModel.getOrderBySurveyorId(surveyor._id)

        return Response.json(orders);
    } catch (error) {
        return errorHandler(error)
    }
}