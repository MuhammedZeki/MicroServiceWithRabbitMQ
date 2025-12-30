import "dotenv/config"
import { app } from "./app.js";
import { mongoClose, connectMongo } from "./config/mongo.js";
import { rabbitClose, connectRabbit } from "./config/rabbitmq.js";
import { setupExchanges } from "./messaging/exchanges.js";
import { setupQueues } from "./messaging/queues.js";
import { setupBindings } from "./messaging/bindings.js";
import { consumeOrderPaymentEvents } from "./consumers/order-payment.consumer.js";
import { consumePaymentStatusUpdate } from "./consumers/payment-status.consumer.js";



const PORT = process.env.PORT || 3001


await connectMongo();
await connectRabbit();

await setupExchanges();
await setupQueues();
await setupBindings();


//EVENTS
await consumeOrderPaymentEvents()
await consumePaymentStatusUpdate()

const server = app.listen(PORT, () => {
    console.log(`Order Server running on port ${PORT}`)
})

const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing connections...`);

    // Sigorta: Eğer 10 saniye içinde kapanmazsa zorla kapat
    setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
    }, 10000);

    server.close(async () => {
        console.log("HTTP server closed.");
        await rabbitClose();
        await mongoClose();
        process.exit(0);
    });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));