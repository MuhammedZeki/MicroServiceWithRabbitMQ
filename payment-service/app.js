import express from 'express';
import paymentRoutes from './routes/payment.route.js';
import { consumePaymentEvents } from './consumers/order-payment.consumer.js';
import { setupExchanges } from './messaging/exchanges.js';
import { setupQueues } from './messaging/queues.js';
import { setupBindings } from './messaging/bindings.js';

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
    } catch (error) {
        console.error("[p-s] Error during messaging setup:", error);
        process.exit(1);
    }
};
