import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_EVENTS_EXCHANGE, PAYMENT_DLQ_EXCHANGE, PAYMENT_EVENTS_EXCHANGE, PAYMENT_ORDER_DLQ_EXCHANGE, PAYMENT_ORDER_RETRY_EXCHANGE, PAYMENT_RETRY_EXCHANGE } from "./constants.js";

export const setupExchanges = async () => {
    //PAYMENT
    await rabbitChannel.assertExchange(PAYMENT_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(PAYMENT_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(PAYMENT_DLQ_EXCHANGE, "direct", { durable: true });

    //ORDER
    await rabbitChannel.assertExchange(ORDER_EVENTS_EXCHANGE, "topic", { durable: true });
    await rabbitChannel.assertExchange(PAYMENT_ORDER_RETRY_EXCHANGE, "direct", { durable: true });
    await rabbitChannel.assertExchange(PAYMENT_ORDER_DLQ_EXCHANGE, "direct", { durable: true });

}
