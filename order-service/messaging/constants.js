//ORDER
export const ORDER_QUEUE = "order.queue";
export const ORDER_RETRY_QUEUE = "order.retry.queue";
export const ORDER_DLQ_QUEUE = "order.dlq.queue";

export const ORDER_EVENTS_EXCHANGE = "order.events";
export const ORDER_RETRY_EXCHANGE = "order.retry.exchange";
export const ORDER_DLQ_EXCHANGE = "order.dlq.exchange";

export const ORDER_CREATED_EVENT = "order.created";
export const ORDER_CANCELLED_EVENT = "order.cancelled";
export const PAYMENT_STATUS_EVENT = "payment.status";

export const ORDER_DLQ_ROUTING_KEY = "order.dlq";
export const ORDER_RETRY_ROUTING_KEY = "order.retry";


//PAYMENT
export const PAYMENT_EVENTS_EXCHANGE = "payment.events";

export const ORDER_PAYMENT_RETRY_EXCHANGE = "order.payment.retry.exchange";
export const ORDER_PAYMENT_DLQ_EXCHANGE = "order.payment.dlq.exchange";

export const ORDER_PAYMENT_QUEUE = "order.payment.queue";
export const ORDER_PAYMENT_RETRY_QUEUE = "order.payment.retry.queue";
export const ORDER_PAYMENT_DLQ_QUEUE = "order.payment.dlq.queue";

export const ORDER_PAYMENT_ROUTING_KEY = "payment.status";
export const ORDER_PAYMENT_RETRY_ROUTING_KEY = "order.payment.retry";
export const ORDER_PAYMENT_DLQ_ROUTING_KEY = "order.payment.dlq";
