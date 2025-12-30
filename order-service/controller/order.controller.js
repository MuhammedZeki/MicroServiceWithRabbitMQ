import { Order } from "../model/Order.model.js";
import { recordFailure } from "../metrics/metrics.js";
import { cancelledOrdersCounter } from "../metrics/order.metrics.js";
import { publishOrderCancelled, publishOrderCreated } from "../services/event.publisher.js";


export const getAllOrders = async (req, res) => {
    try {

        const orders = await Order.find().sort({ createdAt: -1 }) // En son oluşturulan sipariş en başta gelir

        const total = await Order.countDocuments();

        res.status(200).json({
            success: true,
            pagination: {
                totalOrders: total,
            },
            data: orders
        });

    } catch (error) {
        console.error("Siparişleri getirme hatası:", error);

        recordFailure("get_all_orders_error");

        res.status(500).json({
            success: false,
            error: "Siparişler listelenirken bir hata oluştu."
        });
    }
};

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

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Error getting order:", error);
        recordFailure("internal_server_error");
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}

export const getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const allowedStatuses = Order.schema.path("status").enumValues;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status value" });
        }

        const orders = await Order.find({ status });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error getting orders by status:", error);
        recordFailure("internal_server_error");
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOneAndUpdate(
            { orderId, status: { $ne: "CANCELLED" } }, // Zaten iptal edilmişse işlem yapma
            { status: "CANCELLED" },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Sipariş bulunamadı veya zaten iptal edilmiş." });
        }

        // 1. Metriği Artır
        cancelledOrdersCounter.inc({ reason: "user_request" });

        // 2. RabbitMQ'ya Bildir (Stok servisi bunu dinleyip ürünleri geri koyacak)
        await publishOrderCancelled(order);

        res.status(200).json({ success: true, message: "Sipariş iptal edildi.", data: order });
    } catch (error) {
        console.error("İptal hatası:", error);
        res.status(500).json({ error: "İptal işlemi sırasında hata oluştu." });
    }
};