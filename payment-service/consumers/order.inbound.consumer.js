import { ORDER_INBOUND_DLQ_EXCHANGE, ORDER_INBOUND_DLQ_ROUTING_KEY, ORDER_INBOUND_QUEUE, ORDER_INBOUND_RETRY_EXCHANGE, ORDER_INBOUND_RETRY_ROUTING_KEY } from '../messaging/constants.js';
import { rabbitChannel } from '../config/rabbitmq.js';
import { publishEvent } from './../services/event.publisher.js';
import Payment from './../model/Payment.model.js';
import { v4 as uuidv4 } from 'uuid';
import * as OrderHandlers from '../messaging/order.handlers.js';

const EVENT_MAP = {
    "com.ecommerce.order.created": OrderHandlers.handleOrderCreated,
    "com.ecommerce.order.cancelled": OrderHandlers.handleOrderCancelled
};

export const consumerInboundOrderEvents = async () => {
    rabbitChannel.consume(ORDER_INBOUND_QUEUE, async (msg) => {
        if (!msg) return;

        const envelope = JSON.parse(msg.content.toString());
        const { id, type, time, data } = envelope;


        const messageId = msg.properties.messageId || id || uuidv4();
        const { orderId, status } = data;
        const retryCount = msg.properties.headers["x-retries"] || 0;

        try {

            // 1. Önce veri geçerli mi bak (DB öncesi)
            if (!orderId) {
                console.error("[p-s] Geçersiz mesaj: orderId eksik.");
                await publishEvent(ORDER_INBOUND_DLQ_EXCHANGE, ORDER_INBOUND_DLQ_ROUTING_KEY, envelope, { messageId });
                return rabbitChannel.ack(msg);
            }

            // 2. Mevcut kaydı bul
            let payment = await Payment.findOne({ orderId: orderId });

            // 3. KRİTİK DÜZELTME: Eğer kayıt yoksa ve bu bir "İptal" mesajıysa Retry yap!
            // Eğer kayıt yoksa ama bu bir "Created" mesajıysa, yoluna devam et (Kayıt açılacak).
            if (!payment && type === "com.ecommerce.order.cancelled") {
                if (retryCount >= 3) {
                    await publishEvent(ORDER_INBOUND_DLQ_EXCHANGE, ORDER_INBOUND_DLQ_ROUTING_KEY, envelope, { messageId });
                } else {
                    await publishEvent(ORDER_INBOUND_RETRY_EXCHANGE, ORDER_INBOUND_RETRY_ROUTING_KEY, envelope, {
                        headers: { "x-retries": retryCount + 1 }
                    });
                }
                return rabbitChannel.ack(msg);
            }

            // 4. Idempotency Kontrolü
            if (payment?.processedMessageIds.includes(messageId)) {
                console.log(`[p-s] Mesaj zaten işlenmiş: ${messageId}`);
                return rabbitChannel.ack(msg);
            }

            // 5. Handler'ı çalıştır
            const handler = EVENT_MAP[type];
            if (handler) {
                // Not: Created handler'ı payment'ı oluşturur, Cancelled olan günceller.
                await handler(data, payment, messageId);

                // 6. Kaydı mühürle
                const targetPayment = payment || await Payment.findOne({ orderId: orderId });
                if (targetPayment) {
                    targetPayment.processedMessageIds.push(messageId);
                    await targetPayment.save();
                }
            }

            rabbitChannel.ack(msg);

        } catch (error) {
            console.error(`[p-s] Ciddi hata: ${error.message}`);
            if (retryCount < 3) {
                await publishEvent(ORDER_INBOUND_RETRY_EXCHANGE, ORDER_INBOUND_RETRY_ROUTING_KEY, envelope, {
                    headers: { "x-retries": retryCount + 1 },
                    messageId: id
                });
            } else {
                await publishEvent(ORDER_INBOUND_DLQ_EXCHANGE, ORDER_INBOUND_DLQ_ROUTING_KEY, envelope, {
                    messageId: id
                });
            }
            rabbitChannel.ack(msg);
        }
    });
};