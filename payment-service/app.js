import express from 'express';
import paymentRoutes from './routes/payment.route.js';
//import metricsRoutes from './routes/metrics.route.js';
import { consumeOrderCreatedEvent } from './consumers/order-payment.consumer.js';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/payment', paymentRoutes);
//app.use('/metrics', metricsRoutes);

// Start listening for RabbitMQ messages
consumeOrderCreatedEvent().catch(err => {
    console.error("[p-s] Error starting consumer:", err);
    process.exit(1);
});
