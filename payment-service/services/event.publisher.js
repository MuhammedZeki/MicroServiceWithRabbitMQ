import { v4 as uuidv4 } from 'uuid';
import { rabbitChannel } from '../config/rabbitmq.js';


export const publishEvent = async (exchange, routingKey, data, options = {}) => {
  if (!rabbitChannel) {
    console.error('[p-s] RabbitMQ channel is not available.');
    return;
  }

  const {
    headers = {},
    rabbitOptions = {},
    type,
    source,
    messageId
  } = options;


  try {
    // 1. 🛡️ ZARFLAMA (CloudEvent Formatı)
    // Eğer gelen data zaten bir zarf değilse, burada otomatik sarıyoruz.
    const cloudEventEnvelope = {
      specversion: "1.0",
      id: messageId || uuidv4(), // Dışarıdan ID gelmezse biz üretiriz
      type: type || `com.ecommerce.event.${routingKey}`, // Event tipi (opsiyonel)
      source: source || "/services/payment-service",      // Kaynak servis
      time: new Date().toISOString(),
      datacontenttype: "application/json",
      data: data // Asıl gönderdiğin obje buraya girer
    };

    const _data = Buffer.from(JSON.stringify(cloudEventEnvelope));

    rabbitChannel.publish(exchange, routingKey, _data, {
      persistent: true,
      contentType: 'application/json',
      messageId: cloudEventEnvelope.id, // RabbitMQ header'ına da ID'yi yazıyoruz
      headers,    // Retry/X-retries header'ları için
      ...rabbitOptions
    });

    console.log(`[p-s] [CloudEvent] '${routingKey}' anahtarıyla fırlatıldı. ID: ${cloudEventEnvelope.id}`);
  } catch (error) {
    console.error(`[p-s] Publish hatası (${routingKey}):`, error);
  }
};