import amqp from 'amqplib';
import { MqExchanges } from '../messaging/exchanges.js';
import { MqQueues } from '../messaging/queues.js';
import { MqBindings } from '../messaging/bindings.js';

export let rabbitChannel = null;
let connection = null;

async function setupMessaging() {
  for (const exchange of MqExchanges) {
    await rabbitChannel.assertExchange(exchange.name, exchange.type, exchange.options);
  }
  for (const queue of MqQueues) {
    await rabbitChannel.assertQueue(queue.name, queue.options);
  }
  for (const binding of MqBindings) {
    await rabbitChannel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
  }
  console.log('[p-s] RabbitMQ exchanges, queues, and bindings are set up.');
}


export async function connectRabbit() {
  try {
    if (rabbitChannel) return rabbitChannel;

    console.log('[p-s] Connecting to RabbitMQ...');
    connection = await amqp.connect(process.env.RABBIT_URI);
    rabbitChannel = await connection.createChannel();

    await rabbitChannel.prefetch(1); // Process one message at a time

    await setupMessaging();

    console.log('[p-s] Connected to RabbitMQ and channel created successfully.');

    connection.on('error', (err) => {
      console.error('[p-s] RabbitMQ connection error:', err);
      rabbitChannel = null;
    });

    connection.on('close', () => {
      console.error('[p-s] RabbitMQ connection closed. Attempting to reconnect...');
      rabbitChannel = null;
      // You might want to implement a reconnection strategy here
    });

  } catch (error) {
    console.error('[p-s] RabbitMQ connection failed:', error.message);
    throw error;
  }
}

export async function rabbitClose() {
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
}
