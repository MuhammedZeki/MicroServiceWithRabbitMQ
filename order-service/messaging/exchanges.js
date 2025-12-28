import { rabbitChannel } from "../config/rabbitmq.js"

export const setupExchanges = async () => {
    await rabbitChannel.assertExchange("order.events", "topic", { durable: true });
    await rabbitChannel.assertExchange("order.retry.exchange", "direct", { durable: true });
    await rabbitChannel.assertExchange("order.dlq.exchange", "direct", { durable: true });
}