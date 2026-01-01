import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_INBOUND_DLQ_QUEUE, ORDER_INBOUND_QUEUE, ORDER_INBOUND_RETRY_EXCHANGE, ORDER_INBOUND_RETRY_QUEUE, ORDER_INBOUND_RETRY_ROUTING_KEY, PAYMENT_INTERNAL_DLQ_QUEUE, PAYMENT_INTERNAL_QUEUE, PAYMENT_INTERNAL_RETRY_EXCHANGE, PAYMENT_INTERNAL_RETRY_QUEUE, PAYMENT_INTERNAL_RETRY_ROUTING_KEY } from "./constants.js";

export const setupQueues = async () => {

    //MAIN QUEUE(PAYMENT)
    await rabbitChannel.assertQueue(PAYMENT_INTERNAL_QUEUE, {
        durable: true,
        deadLetterExchange: PAYMENT_INTERNAL_RETRY_EXCHANGE,
        deadLetterRoutingKey: PAYMENT_INTERNAL_RETRY_ROUTING_KEY
    });

    // RETRY QUEUE
    await rabbitChannel.assertQueue(PAYMENT_INTERNAL_RETRY_QUEUE, {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: "",
        deadLetterRoutingKey: PAYMENT_INTERNAL_QUEUE
    });

    //DLQ
    await rabbitChannel.assertQueue(PAYMENT_INTERNAL_DLQ_QUEUE, {
        durable: true,
    });




    //MAİN
    await rabbitChannel.assertQueue(ORDER_INBOUND_QUEUE, {
        durable: true,
        deadLetterExchange: ORDER_INBOUND_RETRY_EXCHANGE,
        deadLetterRoutingKey: ORDER_INBOUND_RETRY_ROUTING_KEY
    })


    //Kardeşim, bu mesajla kimseyi uğraştırma, routing key kısmına yazdığım isme sahip kuyruğa sessizce bırak.
    await rabbitChannel.assertQueue(ORDER_INBOUND_RETRY_QUEUE, {
        durable: true,
        messageTtl: 5000,
        deadLetterExchange: "",// "Beni kimseye duyurma, sessizce ilet"
        deadLetterRoutingKey: ORDER_INBOUND_QUEUE,// "Direkt bu kuyruğun içine bırak"
    })

    await rabbitChannel.assertQueue(ORDER_INBOUND_DLQ_QUEUE, {
        durable: true,
    })
}
