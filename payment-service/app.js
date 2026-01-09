import express from 'express';
import paymentRoutes from './routes/payment.route.js';
import { setupExchanges } from './messaging/exchanges.js';
import { setupQueues } from './messaging/queues.js';
import { setupBindings } from './messaging/bindings.js';
import { consumePaymentEvents } from './consumers/payment.internal.consumer.js';
import { consumerInboundOrderEvents } from './consumers/order.inbound.consumer.js';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/payment', paymentRoutes);
//app.use('/metrics', metricsRoutes);

export const startMessaging = async () => {
    try {
        console.log('[p-s] Setting up RabbitMQ exchanges, queues, and bindings...');
        await setupExchanges();
        await setupQueues();
        await setupBindings();
        console.log('[p-s] RabbitMQ setup complete.');

        consumePaymentEvents().catch(err => {
            console.error("[p-s] Error starting consumer:", err);
            process.exit(1);
        });

        consumerInboundOrderEvents().catch(err => {
            console.error("[p-s] Error starting inbound order consumer:", err);
        });
    } catch (error) {
        console.error("[p-s] Error during messaging setup:", error);
        process.exit(1);
    }
};
