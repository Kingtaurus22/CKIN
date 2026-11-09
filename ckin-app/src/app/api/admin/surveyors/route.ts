
import { NextResponse } from "next/server";
import SurveyorModel from "../../../../../db/models/SurveyorModel";

export async function GET() {
  try {
    const surveyors = await SurveyorModel.getAllSurveyors();

    return NextResponse.json(
      {
        message: "Data Surveyor berhasil diambil.",
        surveyors: surveyors.map((surveyor) => ({
          id: surveyor._id.toString(),
          userId: surveyor.UserId.toString(),
          fullname: surveyor.user.fullname,
          email: surveyor.user.email,
          phone: surveyor.user.phone,
          avatar: surveyor.user.avatar,
          domicileProvince: surveyor.domicileProvince,
          domicileCity: surveyor.domicileCity,
          domicileDistrict: surveyor.domicileDistrict,
          coverageAreas: surveyor.coverageAreas,
          verification: surveyor.verification,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get surveyors error:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data Surveyor." },
      { status: 500 }
    );
  }
}
