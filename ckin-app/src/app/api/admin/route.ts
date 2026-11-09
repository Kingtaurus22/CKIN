import { NextResponse } from "next/server";
import AdminModel from "../../../../db/models/AdminModel";

export async function GET() {
  try {
    const admins = await AdminModel.getAllAdmins();

    return NextResponse.json(
      {
        message: "Data Admin berhasil diambil.",
        admins: admins.map((admin) => ({
          id: admin._id.toString(),
          fullname: admin.fullname,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          avatar: admin.avatar,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admins error:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data Admin." },
      { status: 500 }
    );
  }
}