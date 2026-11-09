import { ObjectId } from "mongodb";
import { db } from "../config/mongodb";

export type AssignmentStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "FAILED" | "CANCELLED";
export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED";
export type ServiceType = "SURVEYOR_RECOMENDATION" | "USER_CHOICE";

export interface OrderPayment {
  provider: "MIDTRANS";
  midtransOrderId: string;
  snapToken?: string;
  redirectUrl?: string;
  transactionId?: string;
  paymentType?: string;
  paymentStatus: PaymentStatus;
}
export interface OrderRequirements {
  facilities?: string[];
  budget?: { min: number; max: number };
  genderPreferences?: "MALE" | "FEMALE" | "ANY";
  notes?: string;
}
export interface OrderTarget {
  propertyName: string;
  address: string;
  googleMapsUrls?: string;
  ownerContact?: string;
}
export interface OrderType {
  _id?: ObjectId;
  UserId: string | ObjectId;
  SurveyorId?: string | ObjectId | null;
  serviceType: ServiceType;
  surveyLocation: { province: string; city: string; district: string };
  kosCount: number;
  requirements?: OrderRequirements;
  targets?: OrderTarget[];
  surveyDate: Date;
  moveInDate: Date;
  assignmentStatus: AssignmentStatus;
  status: OrderStatus;
  payment?: OrderPayment;
  pricing: number;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverageDistrict {
  province: string;
  cities: {
    city: string;
    districts: string[];
  }[];
}

class OrdersModel {
  static collection() {
    return db.collection("orders");
  }

  static async getAllOrders() {
    const orders = await this.collection().find().toArray();
    return orders;
  }

  static async checkSurveyorCoverage(surveyLocation: {
    province: string;
    city: string;
    district: string;
  }) {
    const surveyors = await db.collection("surveyors").findOne({
      "coverageAreas.province": surveyLocation.province,
      "coverageAreas.city": surveyLocation.city,
      "coverageAreas.districts": surveyLocation.district,
    });
    return surveyors !== null;
  }

  static async getAllCoverageAreas(): Promise<CoverageDistrict[]> {
    const result = await db
      .collection("surveyors")
      .aggregate([
        // Only documents with coverage information
        {
          $match: {
            "coverageAreas.province": { $exists: true, $ne: "" },
            "coverageAreas.city": { $exists: true, $ne: "" },
            "coverageAreas.districts": { $type: "array" },
          },
        },

        // Split districts into individual documents
        {
          $unwind: "$coverageAreas.districts",
        },

        // Ignore empty districts
        {
          $match: {
            "coverageAreas.districts": { $nin: ["", null] },
          },
        },

        // Group unique districts by city and province
        {
          $group: {
            _id: {
              province: "$coverageAreas.province",
              city: "$coverageAreas.city",
            },
            districts: {
              $addToSet: "$coverageAreas.districts",
            },
          },
        },

        // Group cities by province
        {
          $group: {
            _id: "$_id.province",
            cities: {
              $push: {
                city: "$_id.city",
                districts: "$districts",
              },
            },
          },
        },

        // Format response
        {
          $project: {
            _id: 0,
            province: "$_id",
            cities: 1,
          },
        },

        // Sort provinces alphabetically
        {
          $sort: {
            province: 1,
          },
        },
      ])
      .toArray();

    // Sort cities and districts alphabetically
    return result.map((province) => ({
      province: province.province as string,
      cities: province.cities
        .map((city: { city: string; districts: string[] }) => ({
          city: city.city,
          districts: [...new Set(city.districts)].sort((a, b) =>
            a.localeCompare(b),
          ),
        }))
        .sort((a: { city: string }, b: { city: string }) =>
          a.city.localeCompare(b.city),
        ),
    }));
  }

  static async addOrder(newOrder: OrderType) {
    const res = await this.collection().insertOne(newOrder);
    return {
      ...newOrder,
      _id: res.insertedId,
    };
  }

  static async getOrderById(id: string) {
    if (!ObjectId.isValid(id)) return null;

    return this.collection().findOne({
      _id: new ObjectId(id),
    });
  }

  static async updatePayment(
    id: string,
    payment: Partial<OrderPayment>,
    status?: OrderStatus,
  ) {
    return this.collection().updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          payment: payment,
          ...(status ? { status } : {}),
          updatedAt: new Date(),
        },
      },
    );
  }

  static async updatePaymentByMidtransOrderId(
    midtransOrderId: string,
    payment: Partial<OrderPayment>,
    status?: OrderStatus,
    paidAt?: Date | null,
  ) {
    return this.collection().updateOne(
      { "payment.midtransOrderId": midtransOrderId },
      {
        $set: {
          ...Object.fromEntries(
            Object.entries(payment).map(([key, value]) => [
              `payment.${key}`,
              value,
            ]),
          ),
          ...(status ? { status } : {}),
          ...(paidAt !== undefined ? { paidAt } : {}),
          updatedAt: new Date(),
        },
      },
    );
  }
}

export default OrdersModel;
