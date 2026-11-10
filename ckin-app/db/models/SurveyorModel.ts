import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import { ensureAccountIndexes, hashPassword } from "./AccountModel";
import type { Area, CoverageArea, SurveyorDocument } from "./types";

type District = { id: string; name: string };

function toCoverage(domicile: Area, districts: District[]): CoverageArea {
  // Area jangkauan selalu berada di kabupaten/kota domisili.
  return {
    provinceId: domicile.provinceId,
    province: domicile.province,
    cityId: domicile.cityId,
    city: domicile.city,
    districts: districts.map((d) => d.name),
    districtIds: districts.map((d) => d.id),
  };
}

type CreateSurveyorInput = {
  fullname: string;
  email: string;
  phone: string;
  password: string;
  domicile: Area;
  coverageDistricts: District[];
  experience: string;
  documents: {
    ktpPublicId: string;
    selfiePublicId: string;
  };
};

class SurveyorModel {
  static collection() {
    return getDb().collection<SurveyorDocument>("surveyors");
  }

  static async create(input: CreateSurveyorInput) {
    await ensureAccountIndexes();

    const now = new Date();
    const doc: SurveyorDocument = {
      _id: new ObjectId(),
      fullname: input.fullname,
      email: input.email.toLowerCase(),
      phone: input.phone,
      password: await hashPassword(input.password),
      avatar: null,
      domicile: input.domicile,
      coverageArea: toCoverage(input.domicile, input.coverageDistricts),
      experience: input.experience,
      acceptingOrders: true,
      documents: input.documents,
      verification: {
        status: "PENDING",
        reviewedAt: null,
        rejectionReason: null,
      },
      rating: { average: 0, count: 0 },
      createdAt: now,
      updatedAt: now,
    };

    await this.collection().insertOne(doc);
    return doc;
  }

  static findById(id: ObjectId) {
    return this.collection().findOne({ _id: id });
  }

  static async findNamesByIds(ids: ObjectId[]) {
    if (ids.length === 0) return new Map<string, SurveyorDocument>();
    const surveyors = await this.collection()
      .find({ _id: { $in: ids } }, { projection: { password: 0, documents: 0 } })
      .toArray();
    return new Map(surveyors.map((s) => [s._id.toString(), s]));
  }

  static async updateProfile(
    id: ObjectId,
    data: {
      fullname: string;
      phone: string;
      domicile: Area;
      coverageDistricts: District[];
      experience?: string;
      acceptingOrders?: boolean;
    },
  ) {
    return this.collection().findOneAndUpdate(
      { _id: id },
      {
        $set: {
          fullname: data.fullname,
          phone: data.phone,
          domicile: data.domicile,
          coverageArea: toCoverage(data.domicile, data.coverageDistricts),
          ...(data.experience !== undefined ? { experience: data.experience } : {}),
          ...(data.acceptingOrders !== undefined
            ? { acceptingOrders: data.acceptingOrders }
            : {}),
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

  /** Surveyor yang boleh menerima order: terverifikasi & sedang aktif. */
  static activeFilter() {
    return {
      // Hanya mitra yang sudah diverifikasi tim CKIN yang bisa mengambil order.
      "verification.status": "APPROVED",
      acceptingOrders: { $ne: false },
      "coverageArea.districtIds.0": { $exists: true },
    };
  }

  /**
   * Area (provinsi → kota → kecamatan) yang punya minimal satu surveyor aktif,
   * lengkap dengan ID wilayah & jumlah surveyor. Dipakai form pesanan baru (Anggota 2).
   */
  static async availableAreas(): Promise<AvailableProvince[]> {
    const rows = await this.collection()
      .aggregate<{
        provinceId: string;
        province: string;
        cityId: string;
        city: string;
        districtId: string;
        district: string;
        surveyors: number;
      }>([
        { $match: this.activeFilter() },
        { $unwind: { path: "$coverageArea.districtIds", includeArrayIndex: "idx" } },
        {
          $project: {
            provinceId: "$coverageArea.provinceId",
            province: "$coverageArea.province",
            cityId: "$coverageArea.cityId",
            city: "$coverageArea.city",
            districtId: "$coverageArea.districtIds",
            district: { $arrayElemAt: ["$coverageArea.districts", "$idx"] },
          },
        },
        {
          $group: {
            _id: "$districtId",
            provinceId: { $first: "$provinceId" },
            province: { $first: "$province" },
            cityId: { $first: "$cityId" },
            city: { $first: "$city" },
            district: { $first: "$district" },
            surveyors: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            districtId: "$_id",
            provinceId: 1,
            province: 1,
            cityId: 1,
            city: 1,
            district: 1,
            surveyors: 1,
          },
        },
      ])
      .toArray();

    const provinces = new Map<string, AvailableProvince>();
    for (const row of rows) {
      if (!row.provinceId || !row.cityId || !row.districtId) continue;
      let province = provinces.get(row.provinceId);
      if (!province) {
        province = { id: row.provinceId, name: row.province, cities: [] };
        provinces.set(row.provinceId, province);
      }
      let city = province.cities.find((c) => c.id === row.cityId);
      if (!city) {
        city = { id: row.cityId, name: row.city, districts: [] };
        province.cities.push(city);
      }
      city.districts.push({ id: row.districtId, name: row.district, surveyors: row.surveyors });
    }

    const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
    return [...provinces.values()].sort(byName).map((p) => ({
      ...p,
      cities: p.cities.sort(byName).map((c) => ({ ...c, districts: c.districts.sort(byName) })),
    }));
  }

  static countActiveInDistrict(districtId: string) {
    return this.collection().countDocuments({
      ...this.activeFilter(),
      "coverageArea.districtIds": districtId,
    });
  }
}

export type AvailableProvince = {
  id: string;
  name: string;
  cities: Array<{
    id: string;
    name: string;
    districts: Array<{ id: string; name: string; surveyors: number }>;
  }>;
};

export default SurveyorModel;
