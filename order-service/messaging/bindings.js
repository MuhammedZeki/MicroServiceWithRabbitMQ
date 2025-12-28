import { rabbitChannel } from "../config/rabbitmq.js"

export const setupBindings = async () => {
    await rabbitChannel.bindQueue("order.queue", "order.events", "order.*");
    await rabbitChannel.bindQueue("order.queue", "order.retry.exchange", "retry");
    await rabbitChannel.bindQueue("order.queue", "order.dlq.exchange", "dlq");
}