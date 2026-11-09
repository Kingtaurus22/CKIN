
import { NextResponse } from "next/server";
import AdminModel from "../../../../../db/models/AdminModel";

export async function GET() {
  try {
    const staff = await AdminModel.getAllStaff();

    return NextResponse.json(
      {
        message: "Data Staff berhasil diambil.",
        staff: staff.map((user) => ({
          id: user._id.toString(),
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get staff error:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data Staff." },
      { status: 500 }
    );
  }
}
