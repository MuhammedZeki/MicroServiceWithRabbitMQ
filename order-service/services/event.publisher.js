import { rabbitChannel } from "../config/rabbitmq.js"

export const publishOrderCreated = async (order) => {
    if (!rabbitChannel) {
        console.error("Kanal henüz hazır değil!")
        return;
    }
    rabbitChannel.publish(
        "order.events",
        "order.created",
        Buffer.from(JSON.stringify(order)),
        { persistent: true } //disk yaz
    )
}