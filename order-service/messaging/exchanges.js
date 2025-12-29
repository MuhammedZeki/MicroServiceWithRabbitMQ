import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_DLQ_EXCHANGE, ORDER_EVENTS_EXCHANGE, ORDER_RETRY_EXCHANGE } from "./constants.js";

export const setupExchanges = async () => {
    await rabbitChannel.assertExchange(ORDER_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(ORDER_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(ORDER_DLQ_EXCHANGE, "direct", { durable: true });
}