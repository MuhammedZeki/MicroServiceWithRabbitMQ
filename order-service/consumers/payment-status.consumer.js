import { rabbitChannel } from '../config/rabbitmq.js';
import { ORDER_PAYMENT_DLQ_EXCHANGE, ORDER_PAYMENT_DLQ_ROUTING_KEY, ORDER_PAYMENT_QUEUE, ORDER_PAYMENT_RETRY_EXCHANGE, ORDER_PAYMENT_RETRY_ROUTING_KEY } from '../messaging/constants.js';
import { Order } from '../model/Order.model.js';

export const consumePaymentStatusUpdate = async () => {
  if (!rabbitChannel) {
    console.error('[o-s] RabbitMQ channel is not available. Cannot consume event.');
    return;
  }

  rabbitChannel.consume(ORDER_PAYMENT_QUEUE, async (msg) => {
    if (msg === null) return;


    const headers = msg.properties.headers || {};
    const retryCount = headers['x-retries'] || 0;
    const MAX_RETRIES = 3;


    try {
      const rawData = msg.content.toString();
      console.log("[o-s] Ham mesaj geldi:", rawData); // Gelen paketin içinde ne var canlı görürüz
      const { orderId, status, message } = JSON.parse(rawData);


      //sendToDlq
      if (!orderId || !status) {
        console.error('Invalid message format. Missing orderId or status.');
        rabbitChannel.publish(
          ORDER_PAYMENT_DLQ_EXCHANGE,
          ORDER_PAYMENT_DLQ_ROUTING_KEY,
          msg.content
        )
        return rabbitChannel.ack(msg);
      }

      const order = await Order.findOne({ orderId: orderId });
      if (!order) {
        //order servis db yazma işlemini yavaş sürebilir o yüzden retry aıyoruz payment işini hızlı bitirdi çünkü
        console.error(`Order with orderId ${orderId} not found.`);
        rabbitChannel.publish(
          ORDER_PAYMENT_RETRY_EXCHANGE,
          ORDER_PAYMENT_RETRY_ROUTING_KEY,
          msg.content
        )
        return rabbitChannel.ack(msg);
      }

      if (['COMPLETED', 'FAILED'].includes(order.status)) {
        console.log(`[o-s] Sipariş ${orderId} zaten işlenmiş. Atlanıyor.`);
        return rabbitChannel.ack(msg);
      }

      // Update order status based on payment status
      let newStatus;
      if (status === 'PAYMENT_SUCCESS') {
        newStatus = 'COMPLETED'; // Or 'PAID', depending on your status enum
      } else if (status === 'PAYMENT_FAILURE') {
        newStatus = 'FAILED';
      } else {
        console.warn(`[o-s] Unknown payment status received: ${status}`);
        rabbitChannel.ack(msg); // Acknowledge and ignore unknown statuses
        return;
      }

      order.status = newStatus;
      order.errorLog = message; // Save the message from payment service
      await order.save();

      console.log(`[o-s] Order ${orderId} status updated to ${newStatus}`);

      rabbitChannel.ack(msg);
    } catch (error) {
      if (retryCount >= MAX_RETRIES) {
        console.error(`[o-s] Max retry doldu. Sipariş ${orderId} DLQ'ya gidiyor.`);
        rabbitChannel.publish(
          ORDER_PAYMENT_DLQ_EXCHANGE,
          ORDER_PAYMENT_DLQ_ROUTING_KEY,
          msg.content
        );
        rabbitChannel.ack(msg);

      } else {
        rabbitChannel.publish(
          ORDER_PAYMENT_RETRY_EXCHANGE,
          ORDER_PAYMENT_RETRY_ROUTING_KEY,
          msg.content,
          { headers: { 'x-retries': retryCount + 1 } }
        );
        rabbitChannel.ack(msg)
      }
    }
  }
  );
};
