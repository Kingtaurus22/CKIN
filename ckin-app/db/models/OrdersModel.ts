import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

type OrderStatusHistory = {
  status: string;
  changedAt: Date;
  changedBy: string;
  reason: string;
};

type OrderDocument = {
  _id?: ObjectId;
  UserId: ObjectId;
  SurveyorId: ObjectId | null;
  serviceType: string;
  surveyLocation: {
    province: string;
    city: string;
    district: string;
  };
  kosCount: number;
  requirements: {
    facilities: string[];
    budget: {
      min: number;
      max: number;
    };
    genderPreferences: string;
    notes?: string;
  };
  targets: unknown[];
  surveyDate: Date;
  assignmentStatus: string;
  status: string;
  payment?: {
    provider: string;
    midtransOrderId: string;
    snapToken?: string;
    redirectUrl?: string;
    paymentStatus: string;
    paymentType?: string;
    transactionId?: string;
  };
  pricing: number;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  statusHistory?: OrderStatusHistory[];
};

type CancelOrderInput = {
  orderId: string;
  customerId: string;
};

class OrdersModel {
  static collection() {
    return getDb().collection<OrderDocument>("orders");
  }

  static async getAllOrders() {
    return this.collection().find().toArray();
  }

  /**
   * Customer dapat membatalkan pesanan yang belum diambil Surveyor,
   * baik pesanan sudah dibayar maupun belum dibayar.
   */
  static async cancelOrder({ orderId, customerId }: CancelOrderInput) {
    if (!ObjectId.isValid(orderId) || !ObjectId.isValid(customerId)) {
      return {
        success: false,
        reason: "INVALID_ID",
      };
    }

    const orderObjectId = new ObjectId(orderId);
    const customerObjectId = new ObjectId(customerId);
    const now = new Date();

    const result = await this.collection().updateOne(
      {
        _id: orderObjectId,
        UserId: customerObjectId,
        SurveyorId: null,
        status: {
          $nin: ["CANCELLED", "CANCELED", "COMPLETED"],
        },
      },
      {
        $set: {
          status: "CANCELLED",
          assignmentStatus: "CANCELLED",
          cancelledAt: now,
          updatedAt: now,
        },
        $push: {
          statusHistory: {
            status: "CANCELLED",
            changedAt: now,
            changedBy: customerId,
            reason: "Dibatalkan oleh customer",
          },
        },
      },
    );

    if (result.modifiedCount === 1) {
      const cancelledOrder = await this.collection().findOne({
        _id: orderObjectId,
        UserId: customerObjectId,
      });

      return {
        success: true,
        order: cancelledOrder,
      };
    }

    // Periksa penyebab pembatalan gagal.
    const order = await this.collection().findOne({
      _id: orderObjectId,
      UserId: customerObjectId,
    });

    if (!order) {
      return {
        success: false,
        reason: "NOT_FOUND",
      };
    }

    if (order.SurveyorId) {
      return {
        success: false,
        reason: "ALREADY_ASSIGNED",
      };
    }

    if (order.status === "CANCELLED" || order.status === "CANCELED") {
      return {
        success: false,
        reason: "ALREADY_CANCELLED",
      };
    }

    if (order.status === "COMPLETED") {
      return {
        success: false,
        reason: "ORDER_COMPLETED",
      };
    }

    return {
      success: false,
      reason: "CANNOT_CANCEL",
    };
  }
}

export default OrdersModel;
