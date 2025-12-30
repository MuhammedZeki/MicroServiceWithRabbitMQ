import { rabbitChannel } from "../config/rabbitmq.js"
import { recordFailure } from "../metrics/metrics.js";
import { Order } from "../model/Order.model.js";
import { ORDER_DLQ_EXCHANGE, ORDER_DLQ_ROUTING_KEY, ORDER_QUEUE, ORDER_RETRY_EXCHANGE, ORDER_RETRY_ROUTING_KEY } from "../messaging/constants.js";

export const consumeOrderPaymentEvents = async () => {
    rabbitChannel.consume(ORDER_QUEUE, async (msg) => {
        if (!msg) return;

        const data = JSON.parse(msg.content.toString());
        const retryCount = msg.properties.headers["x-retries"] || 0;
        const messageId = msg.properties.messageId;


        try {
            const order = await Order.findOne({ orderId: data.orderId });

            //IDEMPOTENCY
            if (order.processedMessageIds.includes(messageId)) {
                rabbitChannel.ack(msg);
                return;
            }

            //VALİDATİON HATASI (TEKRARSIZ DİREKT DLQ)
            if (!data.orderId) {
                rabbitChannel.publish(
                    ORDER_DLQ_EXCHANGE,
                    ORDER_DLQ_ROUTING_KEY,
                    msg.content
                );
                rabbitChannel.ack(msg);
                return;
            }

            //SİSTEMSEL HATA SİMULASYONU          

            order.processedMessageIds.push(messageId);
            order.status = "PROCESSED";
            await order.save();
            rabbitChannel.ack(msg);


        } catch (error) {
            console.error(`Error processing message: ${messageId} for order: ${data.orderId}`, error);
            recordFailure(error.message || "Unknown_Error")

            if (retryCount >= 5) {
                console.error(`Max retries reached for message: ${messageId}. Sending to DLQ.`);
                rabbitChannel.publish(
                    ORDER_DLQ_EXCHANGE,
                    ORDER_DLQ_ROUTING_KEY,
                    msg.content
                );
                rabbitChannel.ack(msg);
                return;
            } else {
                console.log(`Retrying message: ${messageId}. Retry count: ${retryCount + 1}`);
                rabbitChannel.publish(
                    ORDER_RETRY_EXCHANGE,
                    ORDER_RETRY_ROUTING_KEY,
                    msg.content,
                    { headers: { "x-retries": retryCount + 1 } }
                )
            }
        }

    })
}



// {
//   // 1. FIELDS: Mesajın ulaşım bilgileri
//   fields: {
//     consumerTag: "amq.ctag-xyz", // Tüketici kimliği
//     deliveryTag: 1,             // Mesajın sıra numarası (ack yaparken lazım olur)
//     redelivered: false,        // Daha önce teslim edilmeye çalışıldı mı?
//     exchange: "order.events",   // Hangi exchange'den geldi
//     routingKey: "order.created" // Hangi anahtar ile geldi
//   },

//   // 2. PROPERTIES: Mesajın üst bilgileri (Metadata)
//   properties: {
//     contentType: "application/json",
//     contentEncoding: "utf-8",
//     headers: {                 // Senin elle eklediğin (retryCount vb.) yer
//        "x-retries": 1,
//        "x-first-death-exchange": "order.events"
//     },
//     deliveryMode: 2,           // 1: geçici, 2: kalıcı (persistent)
//     priority: 0,               // Mesaj önceliği
//     messageId: "abc-123",      // Yayınlarken verdiğin benzersiz ID
//     timestamp: 1735480000,     // Mesajın oluşturulma zamanı
//     appId: "order-service"     // Hangi uygulama gönderdi
//   },

//   // 3. CONTENT: Mesajın asıl gövdesi (Buffer formatında gelir)
//   content: <Buffer 7b 22 6f 72 64 65 72 49 64 22 3a 20 31 32 33 7d>
// }