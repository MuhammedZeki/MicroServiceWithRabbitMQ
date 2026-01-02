import { rabbitChannel } from '../config/rabbitmq.js';

import { publishEvent } from '../services/event.publisher.js';
import Payment from '../model/Payment.model.js';
import { PAYMENT_INTERNAL_DLQ_EXCHANGE, PAYMENT_INTERNAL_DLQ_ROUTING_KEY, PAYMENT_INTERNAL_RETRY_EXCHANGE, PAYMENT_INTERNAL_RETRY_ROUTING_KEY } from '../messaging/constants.js';

const FAKE_PAYMENT_SUCCESS_RATE = 0.5; // 50% success rate to test retries
const MAX_RETRIES = 3;


const processFakePayment = () => {
    const isSuccess = Math.random() < FAKE_PAYMENT_SUCCESS_RATE;
    return {
        success: isSuccess,
        message: isSuccess ? 'Payment successful' : 'Payment failed due to insufficient funds',
    };
};

export const consumePaymentEvents = async () => {
    if (!rabbitChannel) {
        console.error('[p-s] RabbitMQ channel is not available. Cannot consume event.');
        return;
    }

    console.log(`[p-s] Waiting for messages in queue: ${PAYMENT_QUEUE}`);

    rabbitChannel.consume(PAYMENT_QUEUE, async (msg) => {
        if (msg === null) return;

        let data = JSON.parse(msg.content.toString());
        let payment;
        const messageId = msg.properties.messageId || new Date().getTime().toString(); // Fallback for messageId
        const retryCount = msg.properties.headers["x-retries"] || 0;

        try {
            data = JSON.parse(msg.content.toString());
            const { orderId, totalAmount } = data;

            // Basic validation
            if (!orderId || totalAmount === undefined) {
                console.error('[p-s] Invalid message. Missing orderId or totalAmount. Sending to DLQ.');
                await publishEvent(
                    PAYMENT_INTERNAL_DLQ_EXCHANGE,
                    PAYMENT_INTERNAL_DLQ_ROUTING_KEY,
                    msg.content,
                    { messageId }
                );
                return rabbitChannel.ack(msg);
            }

            // --- Idempotency Handling ---
            payment = await Payment.findOne({ orderId: orderId });

            ///ödeme oluşturuyoruz kullanııcıya
            if (!payment) {
                payment = new Payment({
                    orderId: orderId,
                    amount: totalAmount,
                    status: 'PENDING',
                    processedMessageIds: []
                });
            }



            if (payment && payment.processedMessageIds.includes(messageId)) {
                console.log(`[p-s] Message ${messageId} already processed for order ${orderId}. Skipping.`);
                rabbitChannel.ack(msg);
                return;
            }

            // --- Business Logic ---
            const paymentResult = processFakePayment();
            if (!paymentResult.success) {
                throw new Error(paymentResult.message);
            }

            // --- On Success ---
            payment.status = 'PAYMENT_SUCCESS';
            payment.paymentGatewayMessage = paymentResult.message;
            if (!payment.processedMessageIds.includes(messageId)) {
                payment.processedMessageIds.push(messageId);
            }
            await payment.save();



            await publishEvent(
                PAYMENT_EVENTS_EXCHANGE,
                PAYMENT_STATUS_EVENT,
                {
                    orderId: payment.orderId,
                    status: payment.status,
                    message: payment.paymentGatewayMessage,
                },
                { messageId }
            );

            console.log(`[p-s] Successfully processed payment for orderId: ${orderId}`);
            rabbitChannel.ack(msg);

        } catch (error) {
            console.error(`[p-s] Error processing payment for order ${data?.orderId}: ${error.message}`);

            if (retryCount >= MAX_RETRIES) {

                console.error(`[p-s] Max retries reached for message ${messageId}. Sending to DLQ.`);
                if (payment) {
                    payment.status = 'PAYMENT_FAILURE';
                    payment.paymentGatewayMessage = `Failed after ${MAX_RETRIES} retries: ${error.message}`;
                    if (!payment.processedMessageIds.includes(messageId)) {
                        payment.processedMessageIds.push(messageId);
                    }
                    await payment.save();
                }

                // ORDER SERVİSİNE HABER VER ---
                await publishEvent(
                    PAYMENT_EVENTS_EXCHANGE,
                    PAYMENT_STATUS_EVENT,
                    {
                        orderId: data?.orderId || payment?.orderId,
                        status: 'PAYMENT_FAILURE', // Order servisi bunu alınca siparişi iptal edecek
                        message: `Payment failed after ${MAX_RETRIES} attempts.`,
                    },
                    { messageId }
                );

                await publishEvent(
                    PAYMENT_INTERNAL_DLQ_EXCHANGE,
                    PAYMENT_INTERNAL_DLQ_ROUTING_KEY,
                    msg.content,
                    { messageId }
                );
                return rabbitChannel.ack(msg);
            } else {
                // --- Retry ---
                console.log(`[p-s] Retrying message ${messageId}. Retry count: ${retryCount + 1}`);
                await publishEvent(
                    PAYMENT_INTERNAL_RETRY_EXCHANGE,
                    PAYMENT_INTERNAL_RETRY_ROUTING_KEY,
                    msg.content,
                    {
                        headers: { "x-retries": retryCount + 1 },
                        messageId
                    });
                return rabbitChannel.ack(msg); // Ack original message
            }
        }
    }, {
        noAck: false //Sana söz veriyorum, mesajı işleyince sana 'tamam' (Ack) veya 'hata' (Nack/Reject) diye haber vereceğim. Ben haber vermeden sen bu mesajı silme!
    });
};
