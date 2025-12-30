import { Exchanges } from './constants.js';

const ORDER_EVENTS_EXCHANGE = {
  name: Exchanges.ORDER_EVENTS,
  type: 'topic',
  options: {
    durable: true,
  },
};

export const MqExchanges = [ORDER_EVENTS_EXCHANGE];
