import { rabbitChannel } from '../config/rabbitmq.js';
import { ORDER_EVENTS_EXCHANGE } from '../messaging/constants.js';

/**
 * Publishes an event to RabbitMQ.
 * @param {string} routingKey - The routing key for the event.
 * @param {object} data - The data payload for the event.
 */
export const publishEvent = async (routingKey, data) => {
  if (!rabbitChannel) {
    console.error('RabbitMQ channel is not available. Cannot publish event.');
    return;
  }

  try {
    const message = Buffer.from(JSON.stringify(data));
    const messageId = new Date().getTime().toString(); // Simple unique ID

    rabbitChannel.publish(ORDER_EVENTS_EXCHANGE, routingKey, message, {
      persistent: true, //Elektrik kesilirse bu mesajı sakla
      contentType: 'application/json',
      messageId: messageId,
    });

    console.log(`[p-s] Event published with key '${routingKey}' and messageId '${messageId}':`, data);
  } catch (error) {
    console.error(`[p-s] Error publishing event with key '${routingKey}':`, error);
  }
};
