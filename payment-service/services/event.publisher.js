import { rabbitChannel } from '../config/rabbitmq.js';


export const publishEvent = async (exchange, routingKey, data, options = {}) => {
  if (!rabbitChannel) {
    console.error('RabbitMQ channel is not available. Cannot publish event.');
    return;
  }

  try {
    const message = Buffer.from(JSON.stringify(data));
    const messageId = options.messageId || new Date().getTime().toString(); // Simple unique ID

    rabbitChannel.publish(exchange, routingKey, message, {
      persistent: true, //Elektrik kesilirse bu mesajı sakla
      contentType: 'application/json',
      messageId: messageId,
      ...options
    });

    console.log(`[p-s] Event published with key '${routingKey}' and messageId '${messageId}':`, data);
  } catch (error) {
    console.error(`[p-s] Error publishing event with key '${routingKey}':`, error);
  }
};
