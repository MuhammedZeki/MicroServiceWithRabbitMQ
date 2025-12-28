import { rabbitChannel } from "../config/rabbitmq.js"

export const setupQueues = async () => {

    //MAIN QUEUE
    await rabbitChannel.assertQueue("order.queue", {
        durable: true,
        deadLetterExchange: "order.retry.exchange"
    });

    // RETRY QUEUE
    await rabbitChannel.assertQueue("order.retry.queue", {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: "order.events"
    });

    //DLQ
    await rabbitChannel.assertQueue("order.dlq.queue", {
        durable: true,
    });
}