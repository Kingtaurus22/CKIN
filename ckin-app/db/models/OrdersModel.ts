import { db } from '../config/mongodb';

class OrdersModel {
    static collection() {
        return db.collection('orders');
    }

    static async getAllOrders() {
        const orders = await this.collection().find().toArray();
        return orders;
    }
}

export default OrdersModel;