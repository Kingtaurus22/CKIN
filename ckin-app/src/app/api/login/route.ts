import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import UserModel from "../../../../db/models/UserModel";
import { loginSchema } from "../../../../src/schemas/loginSchema";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const email = validation.data.email.toLowerCase();
    const password = validation.data.password;

    const user = await UserModel.findByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: "Login berhasil.",
        user: {
          id: user._id.toString(),
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Login gagal. Silakan coba kembali." },
      { status: 500 }
    );
  }
}