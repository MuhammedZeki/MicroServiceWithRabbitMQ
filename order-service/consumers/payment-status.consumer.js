import { rabbitChannel } from '../config/rabbitmq.js';
import { PAYMENT_STATUS_UPDATE_QUEUE } from '../messaging/constants.js';
import { Order } from '../model/Order.model.js';

export const consumePaymentStatusUpdate = async () => {
  if (!rabbitChannel) {
    console.error('[o-s] RabbitMQ channel is not available. Cannot consume event.');
    return;
  }

  console.log(`[o-s] Waiting for messages in queue: ${PAYMENT_STATUS_UPDATE_QUEUE}`);

  rabbitChannel.consume(PAYMENT_STATUS_UPDATE_QUEUE, async (msg) => {
    if (msg === null) return;

    let messageContent;

    try {
      messageContent = JSON.parse(msg.content.toString());
      const { orderId, status, message } = messageContent;
      console.log(`[o-s] Received payment status update for order ${orderId}: ${status}`);

      if (!orderId || !status) {
        throw new Error('Invalid message format. Missing orderId or status.');
      }

      const order = await Order.findOne({ orderId: orderId });
      if (!order) {
        throw new Error(`Order with orderId ${orderId} not found.`);
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
      console.error(`[o-s] Error processing payment status update:`, error.message);
      console.error(`[o-s] Original message content:`, msg.content.toString());
      // For payment status updates, we'll nack without requeueing to avoid loops.
      // A more robust implementation would send it to a DLQ for investigation.
      rabbitChannel.nack(msg, false, false);
    }
  },
    {
      noAck: false,
    }
  );
};
