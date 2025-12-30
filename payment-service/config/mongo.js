import mongoose from "mongoose";

export async function connectMongo() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error("[p-s] MONGO_URI .env dosyasında bulunamadı!");
    }
    try {
        await mongoose.connect(uri);
        console.log("[p-s] MongoDB connected");
    } catch (error) {
        console.error("[p-s] MongoDB connection error:", error.message);
        throw error;
    }
}

export async function mongoClose() {
    await mongoose.connection.close();
    console.log("[p-s] MongoDB connection closed");
}
