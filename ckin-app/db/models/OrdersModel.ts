import { ObjectId } from 'mongodb';
import { db, client } from '../config/mongodb';

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

    static async assignOrder(orderId: string, surveyorId: string) {
        if (!ObjectId.isValid(orderId) || !ObjectId.isValid(surveyorId)) {
            throw {
                message: "ID order atau surveyor tidak valid.",
                status: 400
            };
        }

        const orderObjectId = new ObjectId(orderId);
        const surveyorObjectId = new ObjectId(surveyorId);

        const session = client.startSession();

        try {
            let result: { message: string } | undefined;

            await session.withTransaction(async () => {
                const surveyors = db.collection("surveyors");

                // Lock dokumen surveyor untuk mencegah
                // dua request bersamaan melewati batas order.
                const surveyor = await surveyors.findOneAndUpdate(
                    { _id: surveyorObjectId },
                    {
                        $inc: {
                            assignmentVersion: 1
                        }
                    },
                    {
                        session,
                        returnDocument: "after"
                    }
                );

                if (!surveyor) {
                    throw {
                        message: "Data surveyor tidak ditemukan.",
                        status: 404
                    };
                }

                // Ambil seluruh order yang sedang dikerjakan
                const assignedOrders = await this.collection()
                    .find(
                        {
                            SurveyorId: surveyorObjectId,
                            assignmentStatus: "ASSIGNED"
                        },
                        { session }
                    )
                    .toArray();

                // Validasi maksimal 3 order berjalan
                if (assignedOrders.length >= 3) {
                    throw {
                        message:
                            "Kamu sudah memiliki 3 order berjalan. Selesaikan salah satu order terlebih dahulu.",
                        status: 400
                    };
                }

                // Ambil data order yang ingin diambil
                const order = await this.collection().findOne(
                    {
                        _id: orderObjectId,
                        status: "PAID",
                        assignmentStatus: "OPEN",
                        SurveyorId: null
                    },
                    { session }
                );

                if (!order) {
                    throw {
                        message:
                            "Order sudah diambil surveyor lain atau tidak tersedia.",
                        status: 409
                    };
                }

                // Format tanggal menggunakan zona waktu Indonesia
                function getDateKey(date: string | Date) {
                    return new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Asia/Jakarta",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                    }).format(new Date(date));
                }

                const requestedDate = getDateKey(order.surveyDate);

                // Cek apakah surveyor sudah memiliki order dengan tanggal survei yang sama
                const hasSameDate = assignedOrders.some(
                    (assignedOrder) =>
                        getDateKey(assignedOrder.surveyDate) === requestedDate
                );

                if (hasSameDate) {
                    throw {
                        message:
                            "Kamu sudah memiliki jadwal survei pada tanggal tersebut. Silakan pilih tanggal lain.",
                        status: 400
                    };
                }

                // Assign order
                const updateResult = await this.collection().updateOne(
                    {
                        _id: orderObjectId,
                        status: "PAID",
                        assignmentStatus: "OPEN",
                        SurveyorId: null
                    },
                    {
                        $set: {
                            SurveyorId: surveyorObjectId,
                            assignmentStatus: "ASSIGNED",
                            updatedAt: new Date()
                        }
                    },
                    { session }
                );

                if (updateResult.modifiedCount !== 1) {
                    throw {
                        message: "Order gagal diambil. Silakan coba kembali.",
                        status: 409
                    };
                }

                result = {
                    message: "Order berhasil diambil."
                };
            });

            return result;
        } finally {
            await session.endSession();
        }
    }
}

export default OrdersModel;
