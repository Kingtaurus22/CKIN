import { NextResponse } from "next/server";
import UserModel from "@/db/models/UserModel";
import { registerSchema } from "../../../schemas/registerSchema";


export async function POST(request: Request) {
    try {

        const body = await request.json();

        const validation = registerSchema.safeParse({
            name: body.fullname,
            email: body.email,
            phone: body.phone,
            password: body.password,
            agreement: body.agreement,
        });

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: validation.error.issues[0].message,
                },
                { status: 400 }
            );
        }

        const {
            name,
            email,
            phone,
            password,
        } = validation.data;

        const user = await UserModel.createUser({
            fullname: name,
            email,
            password,
            phone,
            role: "customer",
        });

        return NextResponse.json(
            {
                message: "Registrasi berhasil",
                user: {
                    _id: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    avatar: user.avatar,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "EMAIL_ALREADY_EXISTS"
        ) {
            return NextResponse.json(
                {
                    message: "Email sudah terdaftar",
                },
                { status: 409 }
            );
        }

        console.error("Register error:", error);

        return NextResponse.json(
            {
                message: "Terjadi kesalahan saat registrasi",
            },
            { status: 500 }
        );
    }
}