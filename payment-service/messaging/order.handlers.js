import Payment from "../model/Payment.model.js";
import { publishEvent } from "../services/event.publisher.js";
import { PAYMENT_EVENTS_EXCHANGE } from "./constants";

export const handleOrderCreated = async (data, payment, messageId) => {
    const newPayment = new Payment({
        orderId: data.orderId,
        amount: data.totalAmount,
        status: 'PENDING',
        processedMessageIds: []
    });
    // Kaydettikten sonra objenin son halini (id vs. dahil) geri dönüyoruz
    await newPayment.save();

    // 2. Ödeme işlemini tetiklemek için İÇ KUYRUĞA mesaj at
    await publishEvent(
        PAYMENT_EVENTS_EXCHANGE, // Senin iç exchange'in
        "payment.internal.proccess",
        { orderId: data.orderId, totalAmount: data.totalAmount },
        {
            type: "com.ecommerce.payment.process.start",
            headers: {
                "trace-id": `tr-${messageId}}`
            }
        }
    );

};

export const handleOrderCancelled = async (data, payment) => {
    // Statüyü değiştiriyoruz ama kaydetmiyoruz (Ana consumer kaydedecek)
    payment.status = (payment.status === 'PAYMENT_SUCCESS') ? 'REFUNDED' : 'CANCELLED';
    return payment;
};