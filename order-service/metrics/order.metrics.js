import client from 'prom-client';

export const cancelledOrdersCounter = new client.Counter({
    name: "order_cancelled_total",
    help: "Total number of cancelled orders",
    labelNames: ["reason"]
});


export const recordcancelledOrder = (errReason) => {
    cancelledOrdersCounter.inc({ reason: errReason })
}