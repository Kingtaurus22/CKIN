
import { db } from "../config/mongodb";
import { ObjectId } from "mongodb";

type VerificationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type Verification = {
  status: VerificationStatus;
  reviewedBy: ObjectId | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
};

type SurveyorInput = {
  UserId: ObjectId;

  domicileProvince: string;
  domicileCity: string;
  domicileDistrict: string;

  coverageAreas: {
    province: string;
    city: string;
    districts: string[];
  };

  Income: null;

  documents: {
    ktpPublicId: string;
    selfiePublicId: string;
  };

};

class SurveyorModel {
  static collection() {
    return db.collection("surveyors");
  }

  static async getAllSurveyors() {
    return this.collection()
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "UserId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            "user.password": 0,
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
      ])
      .toArray();
  }

  static async createSurveyor(surveyorData: SurveyorInput) {
    const newSurveyor = {
      UserId: surveyorData.UserId,

      domicileProvince: surveyorData.domicileProvince,
      domicileCity: surveyorData.domicileCity,
      domicileDistrict: surveyorData.domicileDistrict,

      coverageAreas: surveyorData.coverageAreas,

      Income: null,

      documents: surveyorData.documents,

      verification: {
        status: "PENDING" as VerificationStatus,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
      },
    };

    const result = await this.collection().insertOne(newSurveyor);

    return {
      ...newSurveyor,
      _id: result.insertedId,
    };
  }

  static async findByUserId(UserId: ObjectId) {
    return this.collection().findOne({ UserId });
  }

  static async updateVerification(
    surveyorId: ObjectId,
    status: VerificationStatus,
    reviewedBy: ObjectId,
    rejectionReason: string | null = null
  ) {
    return this.collection().updateOne(
      { _id: surveyorId },
      {
        $set: {
          verification: {
            status,
            reviewedBy,
            reviewedAt: new Date(),
            rejectionReason:
              status === "REJECTED" ? rejectionReason : null,
          },
        },
      }
    );
  }
}

export default SurveyorModel;
