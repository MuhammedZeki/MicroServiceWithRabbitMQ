import "dotenv/config"
import { app } from "./app.js";
import { mongoClose, connectMongo } from "./config/mongo.js";
import { startRabbitMQ } from "./config/rabbitmq.js";
import { setupExchanges } from "./messaging/exchanges.js";
import { setupQueues } from "./messaging/queues.js";
import { setupBindings } from "./messaging/bindings.js";
import { consumeInboundPaymentEvents } from "./consumers/payment.inbound.consumer.js";
import { consumeInternalOrderEvents } from "./consumers/order.internal.consumer.js";



const PORT = process.env.PORT || 3005


await connectMongo();
await startRabbitMQ();

await setupExchanges();
await setupQueues();
await setupBindings();


//EVENTS
await consumeInternalOrderEvents()
await consumeInboundPaymentEvents()

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