import { Order } from "../model/Order.model.js";

export const createOrder = async (req, res) => {
    const { orderId } = req.body;

    const order = await Order.create({ orderId, status: "CRATED" });

    // event fırlatılacak 

    res.status(201).json({ message: true })

}