import OrdersModel from "@/db/models/OrdersModel";

export async function GET() {
  try {
    const coverageAreas = await OrdersModel.getAllCoverageAreas();

    return Response.json({
      message: "Coverage areas fetched successfully",
      data: coverageAreas,
    });
  } catch (error) {
    console.error("GET COVERAGE AREAS ERROR:", error);

    return Response.json(
      {
        message: "Failed to fetch coverage areas",
      },
      { status: 500 },
    );
  }
}
