import amqp from "amqplib"

export let rabbitChannel = null;
let connection = null;
let reconnecting = false;

const RECONNECT_DELAY = 5000; // 5 saniye

async function connectRabbit() {
    try {
        console.log("Connecting to RabbitMQ...");
        connection = await amqp.connect(process.env.RABBIT_URI);
        rabbitChannel = await connection.createChannel();
        await rabbitChannel.prefetch(1);

        console.log("Connected to RabbitMQ and Channel created");
        reconnecting = false;

        connection.on("error", (err) => {
            console.error("RabbitMQ connection error", err);
            if (err.code !== 'ECONNRESET') {
                // Sadece beklenmedik hatalarda yeniden bağlanmayı dene
                reconnect();
            }
        });

        connection.on("close", () => {
            if (!reconnecting) { // Kullanıcı tarafından kapatılmadıysa
                console.error("RabbitMQ connection closed. Attempting to reconnect...");
                reconnect();
            }
        });

    } catch (error) {
        console.error("RabbitMQ connection failed:", error.message);
        reconnect(); // İlk bağlantı başarısız olursa da yeniden dene
    }
}

function reconnect() {
    if (reconnecting) return;

    reconnecting = true;
    if (rabbitChannel) {
        try {
            rabbitChannel.close();
        } catch (error) {
            // pass
        }
    }
    if (connection) {
        try {
            connection.close();
        } catch (error) {
            // pass
        }
    }

    rabbitChannel = null;
    connection = null;

    setTimeout(startRabbitMQ, RECONNECT_DELAY);
}

export async function startRabbitMQ() {
    if (!connection && !reconnecting) {
        await connectRabbit();
    }
}


export async function rabbitClose() {
    reconnecting = true; // Manuel kapatma, yeniden bağlanmayı engelle
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
    reconnecting = false;
}