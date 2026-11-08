import { errorHandler } from "@/db/helpers/errorHandler";
import SurveyorModel from "@/db/models/SurveyorModel";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const surveyor = await SurveyorModel.getSurveyorById(id);

        if (!surveyor) throw { message: "Surveyor not found", status: 404 };

        return Response.json(surveyor);
    } catch (error) {
        return errorHandler(error)
    }
}