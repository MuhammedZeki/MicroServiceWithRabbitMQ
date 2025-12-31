import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_DLQ_QUEUE, ORDER_EVENTS_EXCHANGE, ORDER_PAYMENT_DLQ_QUEUE, ORDER_PAYMENT_QUEUE, ORDER_PAYMENT_RETRY_EXCHANGE, ORDER_PAYMENT_RETRY_QUEUE, ORDER_PAYMENT_RETRY_ROUTING_KEY, ORDER_PAYMENT_ROUTING_KEY, ORDER_QUEUE, ORDER_RETRY_EXCHANGE, ORDER_RETRY_QUEUE, ORDER_RETRY_ROUTING_KEY, PAYMENT_EVENTS_EXCHANGE } from "./constants.js";

export const setupQueues = async () => {

    //MAIN QUEUE
    await rabbitChannel.assertQueue(ORDER_QUEUE, {
        durable: true,
        deadLetterExchange: ORDER_RETRY_EXCHANGE,
        deadLetterRoutingKey: ORDER_RETRY_ROUTING_KEY
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





    // Order-Payment Queue
    await rabbitChannel.assertQueue(ORDER_PAYMENT_QUEUE, {
        durable: true,
        deadLetterExchange: ORDER_PAYMENT_RETRY_EXCHANGE,
        deadLetterRoutingKey: ORDER_PAYMENT_RETRY_ROUTING_KEY
    });

    await rabbitChannel.assertQueue(ORDER_PAYMENT_RETRY_QUEUE, {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: PAYMENT_EVENTS_EXCHANGE,
        deadLetterRoutingKey: ORDER_PAYMENT_ROUTING_KEY

    });


    await rabbitChannel.assertQueue(ORDER_PAYMENT_DLQ_QUEUE, {
        durable: true,
    });
}