import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_DLQ_QUEUE, ORDER_EVENTS_EXCHANGE, ORDER_QUEUE, ORDER_RETRY_EXCHANGE, ORDER_RETRY_QUEUE, ORDER_RETRY_ROUTING_KEY, PAYMENT_STATUS_UPDATE_QUEUE } from "./constants.js";

export const setupQueues = async () => {

    //MAIN QUEUE
    await rabbitChannel.assertQueue(ORDER_QUEUE, {
        durable: true,
        deadLetterExchange: ORDER_RETRY_EXCHANGE,
        deadLetterRoutingKey: ORDER_RETRY_ROUTING_KEY
    });

    // Payment Status Update Queue
    await rabbitChannel.assertQueue(PAYMENT_STATUS_UPDATE_QUEUE, {
        durable: true,
    });

    // RETRY QUEUE
    await rabbitChannel.assertQueue(ORDER_RETRY_QUEUE, {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: ORDER_EVENTS_EXCHANGE
    });

    //DLQ
    await rabbitChannel.assertQueue(ORDER_DLQ_QUEUE, {
        durable: true,
    });
}