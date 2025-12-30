import { Queues } from './constants.js';

const PAYMENT_QUEUE = {
  name: Queues.PAYMENT,
  options: {
    durable: true,
  },
};

export const MqQueues = [PAYMENT_QUEUE];
