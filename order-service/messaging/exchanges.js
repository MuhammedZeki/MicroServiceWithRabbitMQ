import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_EVENTS_EXCHANGE, ORDER_INTERNAL_DLQ_EXCHANGE, ORDER_INTERNAL_RETRY_EXCHANGE, PAYMENT_EVENTS_EXCHANGE, PAYMENT_INBOUND_DLQ_EXCHANGE, PAYMENT_INBOUND_RETRY_EXCHANGE } from "./constants.js";

export const setupExchanges = async () => {
    //ORDER EVENT
    await rabbitChannel.assertExchange(ORDER_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(ORDER_INTERNAL_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(ORDER_INTERNAL_DLQ_EXCHANGE, "direct", { durable: true });

    //PAYMENT EVENT
    await rabbitChannel.assertExchange(PAYMENT_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(PAYMENT_INBOUND_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(PAYMENT_INBOUND_DLQ_EXCHANGE, "direct", { durable: true });

}