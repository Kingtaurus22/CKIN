import { db } from "../config/mongodb";
import { ObjectId } from "mongodb";

class AdminModel {
  static collection() {
    return db.collection("users");
  }

  static async getAllAdmins() {
    return this.collection()
      .find({ role: "admin" })
      .toArray();
  }

  static async getAllStaff() {
    return this.collection()
      .find({ role: "staff" })
      .toArray();
  }

  static async findById(id: ObjectId) {
    return this.collection().findOne({
      _id: id,
      role: { $in: ["admin", "staff"] },
    });
  }
}

export default AdminModel;
