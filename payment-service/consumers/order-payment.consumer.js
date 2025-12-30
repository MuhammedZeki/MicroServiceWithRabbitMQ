import { rabbitChannel } from '../config/rabbitmq.js';
import { Queues, RoutingKeys } from '../messaging/constants.js';
import { publishEvent } from '../services/event.publisher.js';

const FAKE_PAYMENT_SUCCESS_RATE = 0.8; // 80% success rate

/**
 * Simulates a payment processing.
 * @returns {{success: boolean, message: string}}
 */
const processFakePayment = () => {
  const isSuccess = Math.random() < FAKE_PAYMENT_SUCCESS_RATE;
  return {
    success: isSuccess,
    message: isSuccess ? 'Payment successful' : 'Payment failed due to insufficient funds',
  };
};

export const consumeOrderCreatedEvent = async () => {
  if (!rabbitChannel) {
    console.error('[p-s] RabbitMQ channel is not available. Cannot consume event.');
    return;
  }

  console.log(`[p-s] Waiting for messages in queue: ${Queues.PAYMENT}`);

  rabbitChannel.consume(
    Queues.PAYMENT,
    async (msg) => {
      if (msg === null) {
        return;
      }

      let messageContent;
      try {
        messageContent = JSON.parse(msg.content.toString());
        console.log(`[p-s] Received order to process payment for:`, messageContent);

        const { orderId, totalAmount } = messageContent;

        if (!orderId || totalAmount === undefined) {
          throw new Error('Invalid message format. Missing orderId or totalAmount.');
        }

        // 2. Simulate payment processing
        const paymentResult = processFakePayment();

        // 3. Publish the result back to RabbitMQ
        const paymentStatus = paymentResult.success ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILURE';
        
        await publishEvent(RoutingKeys.PAYMENT_STATUS, {
          orderId,
          status: paymentStatus,
          message: paymentResult.message,
          processedAt: new Date().toISOString(),
        });

        // 4. Acknowledge the message
        rabbitChannel.ack(msg);
        console.log(`[p-s] Successfully processed message for orderId: ${orderId}`);

      } catch (error) {
        console.error(`[p-s] Error processing message:`, error);
        console.error(`[p-s] Original message content:`, msg.content.toString());
        
        // 5. Nack the message to requeue for a retry
        // Be cautious with this in production, it can lead to infinite loops.
        // A dead-letter exchange is a better approach for handling failed messages.
        rabbitChannel.nack(msg, false, true); // (message, allUpTo, requeue)
      }
    },
    {
      noAck: false, // Ensure we manually acknowledge messages
    }
  );
};
