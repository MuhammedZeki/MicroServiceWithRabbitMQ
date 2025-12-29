import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_CREATED_EVENT, ORDER_EVENTS_EXCHANGE } from "../messaging/constants.js";

export const publishOrderCreated = async (order) => {
    if (!rabbitChannel) {
        console.error("Kanal henüz hazır değil!")
        return;
    }
    rabbitChannel.publish(
        ORDER_EVENTS_EXCHANGE,
        ORDER_CREATED_EVENT,
        Buffer.from(JSON.stringify(order)),
        {
            messageId: order.orderId, //Siparişin idsini mesajın kimliği yapıyoruz her mesaja tc no veriyoruz
            persistent: true //disk'e yaz
        }
    )
}