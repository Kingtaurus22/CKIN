
import { ObjectId } from 'mongodb';
import { db } from '../config/mongodb';

class SurveyorModel {
    static collection() {
        return db.collection('surveyors');
    }

    static async getSurveyorById(id: string) {
        const surveyors = await this.collection().aggregate([
            {
                $match: {
                    _id: new ObjectId(id)
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
                    fullname: "$user.fullname"
                }
            },
            {
                $project: {
                    user: 0
                }
            }
        ]).toArray();

        return surveyors[0] || null;
    }
}

export default SurveyorModel;
