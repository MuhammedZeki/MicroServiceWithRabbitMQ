import "dotenv/config"
import { app } from "./app.js";
import { connectMongo } from "./config/mongo.js";
import { connectRabbit } from "./config/rabbitmq.js";
import { setupExchanges } from "./messaging/exchanges.js";
import { setupQueues } from "./messaging/queues.js";
import { setupBindings } from "./messaging/bindings.js";



const PORT = process.env.PORT || 3001


await connectMongo();
await connectRabbit();

await setupExchanges();
await setupQueues();
await setupBindings();

app.listen(PORT, () => {
    console.log(`Order Server running on port ${PORT}`)
})