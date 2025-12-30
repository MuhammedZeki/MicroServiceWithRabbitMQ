export const ORDER_QUEUE = "order.queue";
export const PAYMENT_STATUS_UPDATE_QUEUE = "payment.status.update.queue";
export const ORDER_RETRY_QUEUE = "order.retry.queue";
export const ORDER_DLQ_QUEUE = "order.dlq.queue";

export const ORDER_EVENTS_EXCHANGE = "order.events";
export const ORDER_RETRY_EXCHANGE = "order.retry.exchange";
export const ORDER_DLQ_EXCHANGE = "order.dlq.exchange";

export const ORDER_CREATED_EVENT = "order.created";
export const ORDER_CANCELLED_EVENT = "order.cancelled";
export const PAYMENT_STATUS_EVENT = "payment.status";

export const ORDER_DLQ_ROUTING_KEY = "dlq";
export const ORDER_RETRY_ROUTING_KEY = "retry";