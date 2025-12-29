import amqp from "amqplib"

export let rabbitChannel = null;
let connection = null;


export async function connectRabbit() {

    try {
        if (rabbitChannel) return rabbitChannel;
        connection = await amqp.connect(process.env.RABBIT_URI);
        rabbitChannel = await connection.createChannel();

        await rabbitChannel.prefetch(1);

        console.log("Connected to RabbitMQ and Channel created")

        connection.on("error", (err) => {
            console.error("RabitMQ connection error", err);
            rabbitChannel = null
        })
    } catch (error) {
        console.error("RabbitMQ connection failed:", error.message)
        throw error
    }
}

export async function rabbitClose() {
    if (rabbitChannel) {
        await rabbitChannel.close();
        rabbitChannel = null;
        console.log("RabbitMQ channel closed");
    }
    if (connection) {
        await connection.close();
        connection = null;
        console.log("RabbitMQ connection closed");
    }
}