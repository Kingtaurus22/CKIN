import OrdersModel, { OrderType } from "@/db/models/OrdersModel";
import { createOrderSchema } from "@/src/lib/validation/order";
import { ObjectId } from "mongodb";

const PRICE_PER_KOST = 75000;
const SERVICE_FEE = 5000;

export async function GET() {
  try {
    const orders = await OrdersModel.getAllOrders();
    return Response.json({
      message: `Orders fetch successfully`,
      data: orders,
    });
  } catch (error) {
    console.error(`GET ORDERS ERROR: `, error);
    return Response.json({ message: `Internal Server Error` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          message: "Validation failed",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    const isSurveyorAvailable = await OrdersModel.checkSurveyorCoverage(
      data.surveyLocation,
    );
    if (!isSurveyorAvailable) {
      return Response.json(
        {
          message: `No surveyor available in ${data.surveyLocation.district}, ${data.surveyLocation.city}, ${data.surveyLocation.province}`,
        },
        { status: 404 },
      );
    }

    // TODO
    const UserId = "6aef496fd6d282d09954efd2";

    const now = new Date();

    const newOrder: OrderType = {
      UserId: new ObjectId(UserId),
      SurveyorId: null,

      serviceType: data.serviceType,

      surveyLocation: data.surveyLocation,

      kosCount: data.kosCount,

      requirements: data.requirements,

      targets: data.targets,

      surveyDate: new Date(`${data.surveyDate}T00:00:00.000Z`),
      moveInDate: new Date(`${data.moveInDate}T00:00:00.000Z`),

      assignmentStatus: "OPEN",
      status: "PENDING_PAYMENT",

      payment: {
        provider: "MIDTRANS",
        midtransOrderId: "",
        paymentStatus: "UNPAID",
      },

      pricing: PRICE_PER_KOST * data.kosCount + SERVICE_FEE,

      paidAt: null,

      createdAt: now,
      updatedAt: now,
    };

    const result = await OrdersModel.addOrder(newOrder);

    return Response.json(
      {
        message: "Order created successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
