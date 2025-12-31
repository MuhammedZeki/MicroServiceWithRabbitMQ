//ORDER
export const ORDER_EVENTS_EXCHANGE = 'order.events';

export const PAYMENT_ORDER_QUEUE = 'payment.order.queue';
export const PAYMENT_ORDER_RETRY_QUEUE = 'payment.order.retry.queue';
export const PAYMENT_ORDER_DLQ_QUEUE = 'payment.order.dlq.queue';

export const PAYMENT_ORDER_RETRY_EXCHANGE = 'payment.order.retry.exchange';
export const PAYMENT_ORDER_DLQ_EXCHANGE = 'payment.order.dlq.exchange';

export const PAYMENT_ORDER_RETRY_ROUTING_KEY = 'payment.order.retry';
export const PAYMENT_ORDER_DLQ_ROUTING_KEY = 'payment.order.dlq';
export const PAYMENT_ORDER_ROUTING_KEY = 'order.created';

//PAYMENT

// PAYMENT EXCHANGES
export const PAYMENT_EVENTS_EXCHANGE = 'payment.events';
export const PAYMENT_RETRY_EXCHANGE = 'payment.retry.exchange';
export const PAYMENT_DLQ_EXCHANGE = 'payment.dlq.exchange';

// PAYMENT QUEUES
export const PAYMENT_QUEUE = 'payment.queue';
export const PAYMENT_RETRY_QUEUE = 'payment.retry.queue';
export const PAYMENT_DLQ_QUEUE = 'payment.dlq.queue';

// PAYMENT ROUTING KEYS
export const PAYMENT_STATUS_EVENT = 'payment.status';
export const PAYMENT_RETRY_ROUTING_KEY = 'payment.retry';
export const PAYMENT_DLQ_ROUTING_KEY = 'payment.dlq';