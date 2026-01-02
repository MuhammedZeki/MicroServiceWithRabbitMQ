//ORDER
export const ORDER_EVENTS_EXCHANGE = "order.events";
export const ORDER_INTERNAL_RETRY_EXCHANGE = "order.internal.retry.exchange";
export const ORDER_INTERNAL_DLQ_EXCHANGE = "order.internal.dlq.exchange";

export const ORDER_INTERNAL_QUEUE = "order.internal.queue";
export const ORDER_INTERNAL_RETRY_QUEUE = "order.internal.retry.queue";
export const ORDER_INTERNAL_DLQ_QUEUE = "order.internal.dlq.queue";

export const ORDER_INTERNAL_CREATED_EVENT = "order.internal.created";
export const ORDER_INTERNAL_CANCELLED_EVENT = "order.internal.cancelled";

export const ORDER_INTERNAL_DLQ_ROUTING_KEY = "order.internal.dlq";
export const ORDER_INTERNAL_RETRY_ROUTING_KEY = "order.internal.retry";

export const ORDER_CANCELLED_EVENT = "order.cancelled";
export const ORDER_CREATED_EVENT = "order.created";



//PAYMENT
export const PAYMENT_EVENTS_EXCHANGE = "payment.events";

export const PAYMENT_INBOUND_RETRY_EXCHANGE = "payment.inbound.retry.exchange";
export const PAYMENT_INBOUND_DLQ_EXCHANGE = "payment.inbound.dlq.exchange";

export const PAYMENT_INBOUND_QUEUE = "payment.inbound.queue";
export const PAYMENT_INBOUND_RETRY_QUEUE = "payment.inbound.retry.queue";
export const PAYMENT_INBOUND_DLQ_QUEUE = "payment.inbound.dlq.queue";

export const PAYMENT_INBOUND_RETRY_ROUTING_KEY = "payment.inbound.retry";
export const PAYMENT_INBOUND_DLQ_ROUTING_KEY = "payment.inbound.dlq";

export const PAYMENT_STATUS_EVENT = "payment.status";