import amqp from 'amqplib';

export let rabbitChannel = null;
let connection = null;
let reconnecting = false;

const RECONNECT_DELAY = 5000; // 5 saniye

async function connectRabbit() {
    try {
        console.log('[p-s] Connecting to RabbitMQ...');
        connection = await amqp.connect(process.env.RABBIT_URI);
        rabbitChannel = await connection.createChannel();
        await rabbitChannel.prefetch(1);

        console.log('[p-s] Connected to RabbitMQ and Channel created');
        reconnecting = false;

        connection.on('error', (err) => {
            console.error('[p-s] RabbitMQ connection error:', err);
            if (err.code !== 'ECONNRESET') {
                reconnect();
            }
        });

        connection.on('close', () => {
            if (!reconnecting) {
                console.error('[p-s] RabbitMQ connection closed. Attempting to reconnect...');
                reconnect();
            }
        });

    } catch (error) {
        console.error('[p-s] RabbitMQ connection failed:', error.message);
        reconnect();
    }
}

function reconnect() {
    if (reconnecting) return;

    reconnecting = true;
    if (rabbitChannel) {
        try {
            rabbitChannel.close();
        } catch (error) {
            // pass
        }
    }
    if (connection) {
        try {
            connection.close();
        } catch (error) {
            // pass
        }
    }

    rabbitChannel = null;
    connection = null;

    setTimeout(startRabbitMQ, RECONNECT_DELAY);
}

export async function startRabbitMQ() {
    if (!connection && !reconnecting) {
        await connectRabbit();
    }
}

export async function rabbitClose() {
    reconnecting = true;
    if (rabbitChannel) {
        await rabbitChannel.close();
        rabbitChannel = null;
        console.log('[p-s] RabbitMQ channel closed');
    }
    if (connection) {
        await connection.close();
        connection = null;
        console.log('[p-s] RabbitMQ connection closed');
    }
    reconnecting = false;
}
