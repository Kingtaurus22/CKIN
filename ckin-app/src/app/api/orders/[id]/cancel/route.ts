import { NextRequest, NextResponse } from "next/server";
import OrdersModel from "@/db/models/OrdersModel";
import { verifyCustomerToken } from "@/src/lib/auth/verify-customer-token";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Verifikasi JWT Customer
    const user = verifyCustomerToken(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Silakan login sebagai Customer.",
        },
        { status: 401 },
      );
    }

    // 2. Ambil ID pesanan dari URL
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID pesanan tidak ditemukan.",
        },
        { status: 400 },
      );
    }

    // 3. Jalankan pembatalan pesanan
    const result = await OrdersModel.cancelOrder({
      orderId: id,
      customerId: user.sub,
    });

    // 4. Jika pembatalan berhasil
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: "Pesanan berhasil dibatalkan.",
          data: result.order,
        },
        { status: 200 },
      );
    }

    // 5. Tangani kegagalan pembatalan
    const errors: Record<string, { message: string; status: number }> = {
      INVALID_ID: {
        message: "ID pesanan atau Customer tidak valid.",
        status: 400,
      },
      NOT_FOUND: {
        message: "Pesanan tidak ditemukan.",
        status: 404,
      },
      ALREADY_ASSIGNED: {
        message: "Pesanan sudah diambil Surveyor dan tidak dapat dibatalkan.",
        status: 409,
      },
      ALREADY_CANCELLED: {
        message: "Pesanan sudah dibatalkan sebelumnya.",
        status: 409,
      },
      ORDER_COMPLETED: {
        message: "Pesanan yang sudah selesai tidak dapat dibatalkan.",
        status: 409,
      },
      CANNOT_CANCEL: {
        message: "Pesanan tidak dapat dibatalkan.",
        status: 409,
      },
    };

    const reason = result.reason;

    const error = reason
      ? (errors[reason] ?? {
          message: "Terjadi kesalahan saat membatalkan pesanan.",
          status: 500,
        })
      : {
          message: "Terjadi kesalahan saat membatalkan pesanan.",
          status: 500,
        };

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.status },
    );
  } catch (error) {
    console.error("Cancel order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 },
    );
  }
}
