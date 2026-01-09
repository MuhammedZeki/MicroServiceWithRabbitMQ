import { rabbitChannel } from '../config/rabbitmq.js';
import { PAYMENT_INBOUND_DLQ_EXCHANGE, PAYMENT_INBOUND_DLQ_ROUTING_KEY, PAYMENT_INBOUND_QUEUE, PAYMENT_INBOUND_RETRY_EXCHANGE, PAYMENT_INBOUND_RETRY_ROUTING_KEY } from '../messaging/constants.js';
import { Order } from '../model/Order.model.js';

export const consumeInboundPaymentEvents = async () => {
  if (!rabbitChannel) {
    console.error('[o-s] RabbitMQ channel is not available. Cannot consume event.');
    return;
  }

  rabbitChannel.consume(PAYMENT_INBOUND_QUEUE, async (msg) => {
    console.log("!!!!!!!! MESAJ GELDİ !!!!!!!!!");
    if (msg === null) return;


    const headers = msg.properties.headers || {};
    const retryCount = headers['x-retries'] || 0;
    const MAX_RETRIES = 3;


    //PAYMENT SERVİSDEN HATA GELİYOR payment.internal'ın catch'den
    // {
    //   orderId: data?.orderId || payment?.orderId,
    //   status: 'PAYMENT_FAILURE', // Order servisi bunu alınca siparişi iptal edecek
    //   message: `Payment failed after ${MAX_RETRIES} attempts.`,
    //}
    let orderId, status, message;

    try {
      const rawData = msg.content.toString();
      const parsedData = JSON.parse(rawData); // Parse işlemini try içinde yapıyoruz!
      orderId = parsedData.orderId;
      status = parsedData.status;
      message = parsedData.message;

      //sendToDlq
      if (!orderId || !status) {
        console.error('Invalid message format. Missing orderId or status.');
        rabbitChannel.publish(
          PAYMENT_INBOUND_DLQ_EXCHANGE,
          PAYMENT_INBOUND_DLQ_ROUTING_KEY,
          msg.content
        )
        return rabbitChannel.ack(msg);
      }

      const order = await Order.findOne({ orderId: orderId });
      if (!order) {
        //order servis db yazma işlemini yavaş sürebilir o yüzden retry aıyoruz payment işini hızlı bitirdi çünkü
        if (retryCount >= MAX_RETRIES) {
          rabbitChannel.publish(
            PAYMENT_INBOUND_DLQ_EXCHANGE,
            PAYMENT_INBOUND_DLQ_ROUTING_KEY,
            msg.content
          );
          return rabbitChannel.ack(msg);
        } else {
          console.error(`Order with orderId ${orderId} not found.`);
          rabbitChannel.publish(
            PAYMENT_INBOUND_RETRY_EXCHANGE,
            PAYMENT_INBOUND_RETRY_ROUTING_KEY,
            msg.content
          )
          return rabbitChannel.ack(msg);
        }
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

        // 1. Önce Order Service'e "Kral biz denedik ama ödeme patladı" diyoruz.
        if (orderId) {
          await publishEvent(
            PAYMENT_EVENTS_EXCHANGE,
            PAYMENT_STATUS_EVENT,
            {
              orderId: orderId,
              status: 'PAYMENT_FAILURE', // Order bunu alınca siparişi iptal eder
              message: `Payment failed after ${MAX_RETRIES} attempts: ${error.message}`
            }
          );
        }


        // 2. Sonra teknik inceleme için mezarlığa (DLQ) atıyoruz.
        console.error(`[o-s] Max retry doldu. Sipariş ${orderId} DLQ'ya gidiyor.`);
        rabbitChannel.publish(
          PAYMENT_INBOUND_DLQ_EXCHANGE,
          PAYMENT_INBOUND_DLQ_ROUTING_KEY,
          msg.content
        );
        rabbitChannel.ack(msg);

      } else {
        rabbitChannel.publish(
          PAYMENT_INBOUND_RETRY_EXCHANGE,
          PAYMENT_INBOUND_RETRY_ROUTING_KEY,
          msg.content,
          { headers: { 'x-retries': retryCount + 1 } }
        );
        rabbitChannel.ack(msg)
      }
    }
  }
  );
};
