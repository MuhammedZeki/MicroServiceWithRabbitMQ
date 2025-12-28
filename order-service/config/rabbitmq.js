import amqp from "amqplib"


export async function connectRabbit() {
    const conn = await amqp.connect(process.env.RABBIT_URI);
    const channel = await conn.createChannel();
    channel.prefetch(1) //consumra gidicek olan mesaj sayısı
    console.log("Connected the RabbitMQ")
    return channel
}