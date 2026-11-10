import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import { ensureAccountIndexes, hashPassword } from "./AccountModel";
import type { Area, CustomerDocument } from "./types";

type CreateCustomerInput = {
  fullname: string;
  email: string;
  phone: string;
  password: string;
};

class CustomerModel {
  static collection() {
    return getDb().collection<CustomerDocument>("customers");
  }

  static async create(input: CreateCustomerInput) {
    await ensureAccountIndexes();

    const now = new Date();
    const doc: CustomerDocument = {
      _id: new ObjectId(),
      fullname: input.fullname,
      email: input.email.toLowerCase(),
      phone: input.phone,
      password: await hashPassword(input.password),
      avatar: null,
      domicile: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection().insertOne(doc);
    return doc;
  }

  static findById(id: ObjectId) {
    return this.collection().findOne({ _id: id });
  }

  static async updateProfile(
    id: ObjectId,
    data: { fullname: string; phone: string; domicile?: Area | null },
  ) {
    return this.collection().findOneAndUpdate(
      { _id: id },
      {
        $set: {
          fullname: data.fullname,
          phone: data.phone,
          ...(data.domicile !== undefined ? { domicile: data.domicile } : {}),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  static async updatePassword(id: ObjectId, newPassword: string) {
    return this.collection().updateOne(
      { _id: id },
      { $set: { password: await hashPassword(newPassword), updatedAt: new Date() } },
    );
  }
}

export default CustomerModel;
