import client from 'prom-client';


export const failedMessages = new client.Counter({
    name: "Order_failed_messages_total", //Grafana'da bu metriği aratırken kullanacağın isimdir.
    help: "Total failed messages",
    labelNames: ["reason", "service"] //burda hata nerden geldiğini belirtiyoruz reason:dbTimeout region:turkey gibi

})

export const recordFailure = (errReason) => {
    failedMessages.inc({ reason: errReason, service: "order-sevice" })
}