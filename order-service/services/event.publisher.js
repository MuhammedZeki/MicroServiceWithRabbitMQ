import { rabbitChannel } from "../config/rabbitmq.js"
import { ORDER_CANCELLED_EVENT, ORDER_CREATED_EVENT, ORDER_EVENTS_EXCHANGE } from "../messaging/constants.js";
import { v4 as uuidv4 } from 'uuid';

export const publishOrderCreated = async (order) => {
    if (!rabbitChannel) {
        console.error("Kanal henüz hazır değil!");
        return;
    }

    // 1. Kurumsal Zarf (CloudEvent) Hazırlığı
    const cloudEvent = {
        specversion: "1.0",
        type: "com.ecommerce.order.created", // Olay tipi
        source: "/services/order-service",    // Kaynak servis
        id: uuidv4(),                         // Mesajın benzersiz ID'si
        time: new Date().toISOString(),       // Zaman damgası
        datacontenttype: "application/json",

        // 2. Asıl Sipariş Verisi (PayLoad)
        data: {
            orderId: order.orderId,
            //userId: order.userId,
            totalAmount: order.totalAmount || 0,
            items: order.items, // Sepet içeriği gerekirse
            status: "PENDING"
        }
    };

    // 3. RabbitMQ'ya Fırlatma
    rabbitChannel.publish(
        ORDER_EVENTS_EXCHANGE,
        ORDER_CREATED_EVENT,
        Buffer.from(JSON.stringify(cloudEvent)),
        {
            messageId: cloudEvent.id, // Takip barkodu
            persistent: true,         // Diske yaz (Garantiye al)
            headers: {
                "trace-id": `tr-${uuidv4()}` // Tüm akışı takip edecek izleme ID'si
            }
        }
    );

    console.log(`[o-s] Order Created CloudEvent fırlatıldı (ID: ${cloudEvent.id})`);
};


export const publishOrderCancelled = async (order) => {

    if (!rabbitChannel) {
        console.error("Kanal henüz hazır değil!")
        return;
    }


    const cloudEvent = {
        specversion: "1.0",
        type: "com.ecommerce.order.cancelled", // Olayın tipi (Noktalı yazım yaygındır)
        source: "/services/order-service",    // Mesajın kaynağı
        id: uuidv4(),                         // Mesajın TC Kimlik No'su (Benzersiz)
        time: new Date().toISOString(),       // ISO 8601 formatında zaman damgası
        datacontenttype: "application/json",

        // 2. Asıl İş Verisi (Payload)
        data: {
            orderId: order.orderId,
            //userId: order.userId,           // Payment servisi iadeyi kime yapacağını bilsin
            status: "CANCELLED",
            reason: "user_request",         // İptal nedeni (Analiz için kritik)
            totalAmount: order.totalAmount || 0 // İade edilecek tutar teyidi
        }
    };


    rabbitChannel.publish(
        ORDER_EVENTS_EXCHANGE, //order.event
        ORDER_CANCELLED_EVENT, //order.cancelled
        Buffer.from(JSON.stringify(cloudEvent)),
        {
            messageId: cloudEvent.id,
            persistent: true,
            headers: { "x-trace-id": `tr-${uuidv4()}` }
        }
    );
    console.log(`CloudEvent fırlatıldı (ID: ${cloudEvent.id})`)
};


// trace-id ile arama yaparsın: Siparişin tüm hayat hikayesini (Order -> Payment -> Stock) tek bir ekranda görürsün.

// messageId'ye bakarsın: "Acaba Payment servisi bu mesajı iki kere mi işlemeye çalıştı?" sorusunu cevaplarsın.

// envelope.id'ye bakarsın: Veritabanında (Mongo'da) bu mesajın içeriğini bulursun.