import { ObjectId } from 'mongodb';
import { db } from '../config/mongodb';

class OrdersModel {
    static collection() {
        return db.collection('orders');
    }

    static async getAllOrders() {
        const orders = await this.collection().find().toArray();
        return orders;
    }

    static async getOrderByCoverageAreas(coverageAreas: {
        province: string;
        city: string;
        districts: string[];
    }) {
        if (!coverageAreas.districts || coverageAreas.districts.length === 0) {
            return [];
        }

        const orders = await this.collection().aggregate([
            {
                $match: {
                    "surveyLocation.province": coverageAreas.province,
                    "surveyLocation.city": coverageAreas.city,
                    "surveyLocation.district": {
                        $in: coverageAreas.districts
                    },
                    assignmentStatus: "OPEN",
                    status: "PAID",
                    SurveyorId: null
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "UserId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    customerName: "$user.fullname"
                }
            },
            {
                $project: {
                    user: 0
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]).toArray();

        return orders;
    }

    static async getOrderBySurveyorId(id: ObjectId) {
        const orders = await this.collection().aggregate([
            {
                $match: {
                    SurveyorId: id
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "UserId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    customerName: "$user.fullname"
                }
            },
            {
                $project: {
                    user: 0
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]).toArray();

        return orders;
    }
}

export default OrdersModel;
