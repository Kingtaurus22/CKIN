import { db } from "../config/mongodb";
import bcrypt from "bcryptjs";

type UserInput = {
  fullname: string;
  email: string;
  password: string;
  phone: string;
  role: "customer" | "surveyor" | "admin" | "staff";
  avatar?: string | null;
};

class UserModel {
  static collection() {
    return db.collection("users");
  }

  static async getAllUsers() {
    return this.collection().find().toArray();
  }

  static async findByEmail(email: string) {
    return this.collection().findOne({
      email: email.trim().toLowerCase(),
    });
  }

  static async createUser(userData: UserInput) {
    const email = userData.email.trim().toLowerCase();

    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(
      userData.password,
      10
    );

    const newUser = {
      fullname: userData.fullname.trim(),
      email,
      password: hashedPassword,
      phone: userData.phone.trim(),
      role: userData.role,
      avatar: userData.avatar ?? null,
    };

    const result = await this.collection().insertOne(newUser);

    return {
      ...newUser,
      _id: result.insertedId,
    };
  }
}

export default UserModel;
