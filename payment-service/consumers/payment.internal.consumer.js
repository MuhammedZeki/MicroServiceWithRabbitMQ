import { rabbitChannel } from '../config/rabbitmq.js';

import { publishEvent } from '../services/event.publisher.js';
import Payment from '../model/Payment.model.js';
import { PAYMENT_EVENTS_EXCHANGE, PAYMENT_INTERNAL_DLQ_EXCHANGE, PAYMENT_INTERNAL_DLQ_ROUTING_KEY, PAYMENT_INTERNAL_QUEUE, PAYMENT_INTERNAL_RETRY_EXCHANGE, PAYMENT_INTERNAL_RETRY_ROUTING_KEY, PAYMENT_STATUS_EVENT } from '../messaging/constants.js';

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

    console.log(`[p-s] Waiting for messages in queue: ${PAYMENT_INTERNAL_QUEUE}`);

    rabbitChannel.consume(PAYMENT_INTERNAL_QUEUE, async (msg) => {
        if (msg === null) return;

        const envelope = JSON.parse(msg.content.toString());
        const { data, id } = envelope; // CloudEvent'ten gelen id ve data

        // Trace ID'yi yakala (Header'dan veya Zarfın içinden)
        const traceId = msg.properties.headers?.["x-trace-id"] || id;
        const messageId = msg.properties.messageId || id;
        const retryCount = msg.properties.headers["x-retries"] || 0;
        const originalRoutingKey = msg.properties.headers?.['x-original-routing-key'] || PAYMENT_INTERNAL_QUEUE;
        let payment;
        try {
            const { orderId, totalAmount } = data;

            // Basic validation
            if (!orderId || totalAmount === undefined) {
                console.error('[p-s] Invalid message. Missing orderId or totalAmount. Sending to DLQ.');
                await publishEvent(
                    PAYMENT_INTERNAL_DLQ_EXCHANGE,
                    PAYMENT_INTERNAL_DLQ_ROUTING_KEY,
                    data,
                    {
                        messageId: messageId,
                        headers: {
                            'x-retries': retryCount,
                            'x-trace-id': traceId,
                            'x-original-routing-key': originalRoutingKey,
                            'x-error': 'orderId or totalAmount is missing.'
                        }
                    }
                );
                return rabbitChannel.ack(msg);
            }


            // --- Idempotency Handling ---
            payment = await Payment.findOne({ orderId: orderId });

            ///ödeme oluşturuyoruz kullanıcıya
            if (!payment) {
                payment = new Payment({
                    orderId: orderId,
                    amount: totalAmount || 0,
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
                payment.processedMessageIds = payment.processedMessageIds.slice(-10);
            }
            await payment.save();



            await publishEvent(
                PAYMENT_EVENTS_EXCHANGE,
                PAYMENT_STATUS_EVENT,
                {
                    orderId: payment.orderId,
                    status: payment.status,
                },
                {
                    messageId: messageId,
                    headers: {
                        'x-trace-id': traceId
                    },
                }
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
                    },
                    {
                        messageId: messageId,
                        headers: {
                            'x-trace-id': traceId
                        }
                    }
                );

                await publishEvent(
                    PAYMENT_INTERNAL_DLQ_EXCHANGE,
                    PAYMENT_INTERNAL_DLQ_ROUTING_KEY,
                    data,
                    {
                        messageId: messageId,
                        headers: {
                            'x-retries': retryCount,
                            'x-trace-id': traceId,
                            'x-original-routing-key': originalRoutingKey,
                            'x-error': error.message
                        },
                    }
                );
                return rabbitChannel.ack(msg);
            } else {
                // --- Retry ---
                console.log(`[p-s] Retrying message ${messageId}. Retry count: ${retryCount + 1}`);
                await publishEvent(
                    PAYMENT_INTERNAL_RETRY_EXCHANGE,
                    PAYMENT_INTERNAL_RETRY_ROUTING_KEY,
                    data,
                    {
                        headers: {
                            'x-retries': retryCount + 1,
                            'x-trace-id': traceId,
                            'x-original-routing-key': originalRoutingKey,
                            'x-error': error.message
                        },
                        messageId: messageId
                    });
                return rabbitChannel.ack(msg); // Ack original message
            }
        }
    }, {
        noAck: false //Sana söz veriyorum, mesajı işleyince sana 'tamam' (Ack) veya 'hata' (Nack/Reject) diye haber vereceğim. Ben haber vermeden sen bu mesajı silme!
    });
};
