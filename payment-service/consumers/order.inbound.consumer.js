import {
    ORDER_INBOUND_DLQ_EXCHANGE,
    ORDER_INBOUND_DLQ_ROUTING_KEY,
    ORDER_INBOUND_QUEUE,
    ORDER_INBOUND_RETRY_EXCHANGE,
    ORDER_INBOUND_RETRY_ROUTING_KEY
} from '../messaging/constants.js';

import { rabbitChannel } from '../config/rabbitmq.js';
import { publishEvent } from '../services/event.publisher.js';
import Payment from '../model/Payment.model.js';
import * as OrderHandlers from '../messaging/order.handlers.js';

const MAX_PROCESSED_MESSAGE_IDS = 50;

const EVENT_MAP = {
    'com.ecommerce.order.created': {
        v1: OrderHandlers.handleOrderCreated
    },
    'com.ecommerce.order.cancelled': {
        v1: OrderHandlers.handleOrderCancelled
    }
};

export const consumerInboundOrderEvents = async () => {
    rabbitChannel.consume(ORDER_INBOUND_QUEUE, async (msg) => {
        console.log("!!!!!!!! MESAJ GELDİ !!!!!!!!!");
        if (!msg) return;

        const envelope = JSON.parse(msg.content.toString());
        const { id, type, data } = envelope;

        const messageId = msg.properties.messageId || id;
        const headers = msg.properties.headers || {};

        const retryCount = headers['x-retries'] || 0;
        const traceId = headers['x-trace-id'] || id;
        const eventVersion = headers['x-event-version'] || 'v1';
        const originalRoutingKey = msg.fields.routingKey;

        try {
            const { orderId } = data;

            /* 1️⃣ Basic validation */
            if (!orderId) {
                await publishEvent(
                    ORDER_INBOUND_DLQ_EXCHANGE,
                    ORDER_INBOUND_DLQ_ROUTING_KEY,
                    data,
                    {
                        messageId,
                        headers: {
                            'x-retries': retryCount,
                            'x-trace-id': traceId,
                            'x-error': 'orderId missing',
                            'x-original-routing-key': originalRoutingKey
                        }
                    }
                );
                return rabbitChannel.ack(msg);
            }

            /* 2️⃣ Load payment */
            let payment = await Payment.findOne({ orderId });

            /* 3️⃣ Cancel geldi ama payment yok → retry */
            if (!payment && type === 'com.ecommerce.order.cancelled') {
                const targetExchange =
                    retryCount >= 3
                        ? ORDER_INBOUND_DLQ_EXCHANGE
                        : ORDER_INBOUND_RETRY_EXCHANGE;

                const targetRoutingKey =
                    retryCount >= 3
                        ? ORDER_INBOUND_DLQ_ROUTING_KEY
                        : ORDER_INBOUND_RETRY_ROUTING_KEY;

                await publishEvent(targetExchange, targetRoutingKey, data, {
                    messageId,
                    headers: {
                        'x-retries': retryCount + 1,
                        'x-trace-id': traceId,
                        'x-error': 'payment not found for cancel event',
                        'x-original-routing-key': originalRoutingKey
                    }
                });

                return rabbitChannel.ack(msg);
            }

            /* 4️⃣ Idempotency */
            if (payment?.processedMessageIds?.includes(messageId)) {
                console.log(`[p-s] Duplicate message ignored: ${messageId}`);
                return rabbitChannel.ack(msg);
            }

            /* 5️⃣ Handler */
            const handler = EVENT_MAP[type]?.[eventVersion] || EVENT_MAP[type]?.v1;

            if (!handler) {
                throw new Error(`No handler for ${type} ${eventVersion}`);
            }

            await handler(data, payment, messageId);

            /* 6️⃣ processedMessageIds bounded growth */
            const targetPayment = payment || (await Payment.findOne({ orderId }));

            if (targetPayment) {
                targetPayment.processedMessageIds = targetPayment.processedMessageIds || [];

                targetPayment.processedMessageIds.push(messageId);

                if (targetPayment.processedMessageIds.length > MAX_PROCESSED_MESSAGE_IDS) {
                    targetPayment.processedMessageIds.shift(); // FIFO
                }

                await targetPayment.save();
            }

            rabbitChannel.ack(msg);
        } catch (error) {
            console.error('[p-s] Fatal error:', error.message);

            const isRetry = retryCount < 3;

            await publishEvent(
                isRetry ? ORDER_INBOUND_RETRY_EXCHANGE : ORDER_INBOUND_DLQ_EXCHANGE,
                isRetry ? ORDER_INBOUND_RETRY_ROUTING_KEY : ORDER_INBOUND_DLQ_ROUTING_KEY,
                data,
                {
                    messageId: messageId,
                    headers: {
                        'x-retries': retryCount + 1,
                        'x-trace-id': traceId,
                        'x-error': error.message,
                        'x-original-routing-key': originalRoutingKey
                    }
                }
            );

            rabbitChannel.ack(msg);
        }
    },
        { noAck: false }
    );
};
