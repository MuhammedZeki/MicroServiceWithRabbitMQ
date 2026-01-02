import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_INTERNAL_DLQ_QUEUE, ORDER_INTERNAL_QUEUE, ORDER_INTERNAL_RETRY_EXCHANGE, ORDER_INTERNAL_RETRY_QUEUE, ORDER_INTERNAL_RETRY_ROUTING_KEY, PAYMENT_INBOUND_DLQ_QUEUE, PAYMENT_INBOUND_QUEUE, PAYMENT_INBOUND_RETRY_EXCHANGE, PAYMENT_INBOUND_RETRY_QUEUE, PAYMENT_INBOUND_RETRY_ROUTING_KEY } from "./constants.js";

export const setupQueues = async () => {

    //MAIN QUEUE
    await rabbitChannel.assertQueue(ORDER_INTERNAL_QUEUE, {
        durable: true,
        deadLetterExchange: ORDER_INTERNAL_RETRY_EXCHANGE,
        deadLetterRoutingKey: ORDER_INTERNAL_RETRY_ROUTING_KEY
    });

    // RETRY QUEUE
    await rabbitChannel.assertQueue(ORDER_INTERNAL_RETRY_QUEUE, {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: "",
        deadLetterRoutingKey: ORDER_INTERNAL_QUEUE
    });

    //DLQ
    await rabbitChannel.assertQueue(ORDER_INTERNAL_DLQ_QUEUE, {
        durable: true,
    });


    // Order-Payment Queue
    await rabbitChannel.assertQueue(PAYMENT_INBOUND_QUEUE, {
        durable: true,
        deadLetterExchange: PAYMENT_INBOUND_RETRY_EXCHANGE,
        deadLetterRoutingKey: PAYMENT_INBOUND_RETRY_ROUTING_KEY
    });

    await rabbitChannel.assertQueue(PAYMENT_INBOUND_RETRY_QUEUE, {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: "",
        deadLetterRoutingKey: PAYMENT_INBOUND_QUEUE

    });


    await rabbitChannel.assertQueue(PAYMENT_INBOUND_DLQ_QUEUE, {
        durable: true,
    });
}