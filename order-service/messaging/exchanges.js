import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_DLQ_EXCHANGE, ORDER_EVENTS_EXCHANGE, ORDER_PAYMENT_DLQ_EXCHANGE, ORDER_PAYMENT_RETRY_EXCHANGE, ORDER_RETRY_EXCHANGE } from "./constants.js";

export const setupExchanges = async () => {
    //ORDER EVENT
    await rabbitChannel.assertExchange(ORDER_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(ORDER_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(ORDER_DLQ_EXCHANGE, "direct", { durable: true });

    //PAYMENT EVENT
    await rabbitChannel.assertExchange(PAYMENT_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(ORDER_PAYMENT_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(ORDER_PAYMENT_DLQ_EXCHANGE, "direct", { durable: true });

}