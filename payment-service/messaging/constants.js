//PAYMENT

// PAYMENT EXCHANGES
export const PAYMENT_EVENTS_EXCHANGE = 'payment.events';
export const PAYMENT_INTERNAL_RETRY_EXCHANGE = 'payment.internal.retry.exchange';
export const PAYMENT_INTERNAL_DLQ_EXCHANGE = 'payment.internal.dlq.exchange';

// PAYMENT QUEUES
export const PAYMENT_INTERNAL_QUEUE = 'payment.internal.queue';
export const PAYMENT_INTERNAL_RETRY_QUEUE = 'payment.internal.retry.queue';
export const PAYMENT_INTERNAL_DLQ_QUEUE = 'payment.internal.dlq.queue';

// PAYMENT ROUTING KEYS
export const PAYMENT_STATUS_EVENT = 'payment.status';
export const PAYMENT_INTERNAL_STATUS_EVENT = 'payment.internal.status';
export const PAYMENT_INTERNAL_RETRY_ROUTING_KEY = 'payment.internal.retry';
export const PAYMENT_INTERNAL_DLQ_ROUTING_KEY = 'payment.internal.dlq';
export const PAYMENT_INTERNAL_ROUTING_KEY = 'payment.internal.#';


//ORDER
export const ORDER_EVENTS_EXCHANGE = 'order.events';

export const ORDER_INBOUND_QUEUE = 'order.inbound.queue';
export const ORDER_INBOUND_RETRY_QUEUE = 'order.inbound.retry.queue';
export const ORDER_INBOUND_DLQ_QUEUE = 'order.inbound.dlq.queue';

export const ORDER_INBOUND_RETRY_EXCHANGE = 'order.inbound.retry.exchange';
export const ORDER_INBOUND_DLQ_EXCHANGE = 'order.inbound.dlq.exchange';

export const ORDER_INBOUND_RETRY_ROUTING_KEY = 'order.inbound.retry';
export const ORDER_INBOUND_DLQ_ROUTING_KEY = 'order.inbound.dlq';
export const ORDER_CREATED_EVENT = 'order.created';
export const ORDER_CANCELLED_EVENT = 'order.cancelled';
