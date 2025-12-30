import { Exchanges, Queues, RoutingKeys } from './constants.js';

const OrderCreatedBinding = {
  queue: Queues.PAYMENT, //payment.queue
  exchange: Exchanges.ORDER_EVENTS, //order.event
  routingKey: RoutingKeys.ORDER_CREATED, //order.created
};

export const MqBindings = [OrderCreatedBinding];
