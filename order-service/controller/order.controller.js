import { recordFailure } from "../metrics/metrics.js";
import { Order } from "../model/Order.model.js";
import { publishOrderCreated } from "../services/event.publisher.js";

export const createOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json(
                {
                    success: false,
                    error: "orderId is required"
                }
            );
        }

        const order = await Order.create({ orderId, status: "PENDING" });

        // event fırlatılacak 
        try {
            await publishOrderCreated(order);
        } catch (error) {
            console.error("RabbitMQ bağlantısı hatası:", error);
            recordFailure("rabbitmq_publish_error")
        }

        res.status(201).json({ message: true, data: order });
    } catch (error) {
        console.error("Hata oluştu:", error);

        //MongoDB dUPLİCATE kEY HATASI (11000)
        if (error.code === 11000) {
            recordFailure("duplicate_key")
            return res.status(409).json({
                success: false,
                error: "Order already exists"
            });
        }
        recordFailure("internal_server_error")
        return res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
}