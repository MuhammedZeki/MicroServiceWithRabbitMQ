import client from 'prom-client'
import { recordcancelledOrder } from './order.metrics.js';
import { recordFailure } from './error.metrics.js';

export const register = client.register //Tüm metriklerimi bir torbada topla.

export {
    recordcancelledOrder,
    recordFailure
}