import 'dotenv/config';
import { app, startMessaging } from './app.js';
import { mongoClose, connectMongo } from './config/mongo.js';
import { rabbitClose, connectRabbit } from './config/rabbitmq.js';

const PORT = process.env.PAYMENT_SERVICE_PORT || 3002;

const startServer = async () => {
    try {
        await connectMongo();
        await connectRabbit();
        await startMessaging(); // Setup exchanges/queues and start consumers

        const server = app.listen(PORT, () => {
            console.log(`[p-s] Payment Service running on port ${PORT}`);
        });

        const gracefulShutdown = async (signal) => {
            console.log(`[p-s] ${signal} received. Closing connections...`);

            // Force shutdown after 10 seconds
            const timeout = setTimeout(() => {
                console.error('[p-s] Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);

            server.close(async () => {
                console.log('[p-s] HTTP server closed.');
                await rabbitClose();
                await mongoClose();
                clearTimeout(timeout);
                process.exit(0);
            });
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    } catch (error) {
        console.error('[p-s] Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
