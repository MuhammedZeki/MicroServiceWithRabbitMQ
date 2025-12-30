import "dotenv/config"
import { app } from "./app.js";
import { mongoClose, connectMongo } from "./config/mongo.js";
import { rabbitClose, connectRabbit } from "./config/rabbitMQ.js";



const PORT = process.env.PORT || 3001


await connectMongo();
await connectRabbit();




const server = app.listen(PORT, () => {
    console.log(`Payment Server running on port ${PORT}`)
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