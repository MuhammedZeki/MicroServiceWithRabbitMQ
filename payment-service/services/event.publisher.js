import { rabbitChannel } from '../config/rabbitmq.js';
import { Exchanges } from '../messaging/constants.js';

/**
 * Publishes an event to RabbitMQ.
 * @param {string} routingKey - The routing key for the event.
 * @param {object} data - The data payload for the event.
 * @param {string} [exchange=Exchanges.ORDER_EVENTS] - The exchange to publish to.
 */
export const publishEvent = async (
  routingKey,
  data,
  exchange = Exchanges.ORDER_EVENTS
) => {
  if (!rabbitChannel) {
    console.error(
      'RabbitMQ channel is not available. Cannot publish event.'
    );
    return;
  }

  try {
    const message = Buffer.from(JSON.stringify(data));



    console.log(`[p-s] Event published with key '${routingKey}':`, data);
  } catch (error) {
    console.error(`[p-s] Error publishing event with key '${routingKey}':`, error);
  }
};
