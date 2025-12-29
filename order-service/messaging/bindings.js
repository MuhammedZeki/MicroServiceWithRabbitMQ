import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_DLQ_EXCHANGE, ORDER_DLQ_QUEUE, ORDER_DLQ_ROUTING_KEY, ORDER_EVENTS_EXCHANGE, ORDER_QUEUE, ORDER_RETRY_EXCHANGE, ORDER_RETRY_QUEUE, ORDER_RETRY_ROUTING_KEY } from "./constants.js";

export const setupBindings = async () => {
    await rabbitChannel.bindQueue(ORDER_QUEUE, ORDER_EVENTS_EXCHANGE, "order.*");

    await rabbitChannel.bindQueue(ORDER_RETRY_QUEUE, ORDER_RETRY_EXCHANGE, ORDER_RETRY_ROUTING_KEY);

    await rabbitChannel.bindQueue(ORDER_DLQ_QUEUE, ORDER_DLQ_EXCHANGE, ORDER_DLQ_ROUTING_KEY);
}