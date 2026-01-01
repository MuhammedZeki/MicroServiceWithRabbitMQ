import { rabbitChannel } from '../config/rabbitmq.js';
import {
    PAYMENT_QUEUE,
    PAYMENT_STATUS_EVENT,
    PAYMENT_DLQ_EXCHANGE,
    PAYMENT_DLQ_ROUTING_KEY,
    PAYMENT_RETRY_EXCHANGE,
    PAYMENT_RETRY_ROUTING_KEY,
    PAYMENT_EVENTS_EXCHANGE
} from '../messaging/constants.js';
import { publishEvent } from '../services/event.publisher.js';
import Payment from '../model/Payment.model.js';

const FAKE_PAYMENT_SUCCESS_RATE = 0.5; // 50% success rate to test retries
const MAX_RETRIES = 3;

/**
 * Simulates a payment processing.
 * @returns {{success: boolean, message: string}}
 */
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

        let data;
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
                    PAYMENT_DLQ_EXCHANGE,
                    PAYMENT_DLQ_ROUTING_KEY,
                    msg.content,
                    { messageId }
                );
                return rabbitChannel.ack(msg);
            }

            // --- Idempotency Handling ---
            payment = await Payment.findOne({ orderId: orderId });

            if (payment && payment.processedMessageIds.includes(messageId)) {
                console.log(`[p-s] Message ${messageId} already processed for order ${orderId}. Skipping.`);
                rabbitChannel.ack(msg);
                return;
            }

            if (!payment) {
                payment = new Payment({
                    orderId: orderId,
                    amount: totalAmount,
                    status: 'PENDING',
                    processedMessageIds: []
                });
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
                // --- Dead Lettering ---
                console.error(`[p-s] Max retries reached for message ${messageId}. Sending to DLQ.`);
                if (payment) {
                    payment.status = 'PAYMENT_FAILURE';
                    payment.paymentGatewayMessage = `Failed after ${MAX_RETRIES} retries: ${error.message}`;
                    if (!payment.processedMessageIds.includes(messageId)) {
                        payment.processedMessageIds.push(messageId);
                    }
                    await payment.save();

                    await publishEvent(PAYMENT_STATUS_EVENT, {
                        orderId: payment.orderId,
                        status: payment.status,
                        message: payment.paymentGatewayMessage,
                    });
                }
                rabbitChannel.publish(PAYMENT_DLQ_EXCHANGE, PAYMENT_DLQ_ROUTING_KEY, msg.content, { messageId });
                rabbitChannel.ack(msg);
            } else {
                // --- Retry ---
                console.log(`[p-s] Retrying message ${messageId}. Retry count: ${retryCount + 1}`);
                rabbitChannel.publish(PAYMENT_RETRY_EXCHANGE, PAYMENT_RETRY_ROUTING_KEY, msg.content, {
                    headers: { "x-retries": retryCount + 1 },
                    messageId: messageId
                });
                rabbitChannel.ack(msg); // Ack original message
            }
        }
    }, {
        noAck: false
    });
};
