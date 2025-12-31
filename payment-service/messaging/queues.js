import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_EVENTS_EXCHANGE, PAYMENT_DLQ_QUEUE, PAYMENT_EVENTS_EXCHANGE, PAYMENT_ORDER_DLQ_QUEUE, PAYMENT_ORDER_QUEUE, PAYMENT_ORDER_RETRY_EXCHANGE, PAYMENT_ORDER_RETRY_QUEUE, PAYMENT_ORDER_RETRY_ROUTING_KEY, PAYMENT_ORDER_ROUTING_KEY, PAYMENT_QUEUE, PAYMENT_RETRY_EXCHANGE, PAYMENT_RETRY_QUEUE, PAYMENT_RETRY_ROUTING_KEY } from "./constants.js";

export const setupQueues = async () => {

    //MAIN QUEUE
    await rabbitChannel.assertQueue(PAYMENT_QUEUE, {
        durable: true,
        deadLetterExchange: PAYMENT_RETRY_EXCHANGE,
        deadLetterRoutingKey: PAYMENT_RETRY_ROUTING_KEY
    });

    // RETRY QUEUE
    await rabbitChannel.assertQueue(PAYMENT_RETRY_QUEUE, {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: PAYMENT_EVENTS_EXCHANGE
    });

    //DLQ
    await rabbitChannel.assertQueue(PAYMENT_DLQ_QUEUE, {
        durable: true,
    });




    //MAİN
    await rabbitChannel.assertQueue(PAYMENT_ORDER_QUEUE, {
        durable: true,
        deadLetterExchange: PAYMENT_ORDER_RETRY_EXCHANGE,
        deadLetterRoutingKey: PAYMENT_ORDER_RETRY_ROUTING_KEY
    })

    await rabbitChannel.assertQueue(PAYMENT_ORDER_RETRY_QUEUE, {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: ORDER_EVENTS_EXCHANGE,
        deadLetterRoutingKey: PAYMENT_ORDER_ROUTING_KEY,
    })

    await rabbitChannel.assertQueue(PAYMENT_ORDER_DLQ_QUEUE, {
        durable: true,
    })
}
