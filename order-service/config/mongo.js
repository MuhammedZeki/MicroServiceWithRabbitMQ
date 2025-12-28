import mongoose from "mongoose";

export async function connectMongo() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error("MONGO_URI .env dosyasında bulunamadı!");
    }
    try {
        await mongoose.connect(uri);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
}