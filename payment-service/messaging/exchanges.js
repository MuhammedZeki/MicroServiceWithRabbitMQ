import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_INBOUND_DLQ_EXCHANGE, ORDER_INBOUND_RETRY_EXCHANGE, PAYMENT_EVENTS_EXCHANGE, PAYMENT_INTERNAL_DLQ_EXCHANGE, PAYMENT_INTERNAL_RETRY_EXCHANGE } from "./constants.js";

export const setupExchanges = async () => {
    //PAYMENT
    await rabbitChannel.assertExchange(PAYMENT_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(PAYMENT_INTERNAL_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(PAYMENT_INTERNAL_DLQ_EXCHANGE, "direct", { durable: true });

    //ORDER
    await rabbitChannel.assertExchange(ORDER_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(ORDER_INBOUND_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(ORDER_INBOUND_DLQ_EXCHANGE, "direct", { durable: true });

}
