import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true // Sorgu hızı için index şart
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSED', 'FAILED', 'RETRYING'], // Sadece bu değerleri alabilsin
        default: 'PENDING'
    },
    processedMessageIds: [{
        type: String
    }],
    retryCount: {
        type: Number,
        default: 0
    },
    errorLog: {
        type: String
    }
}, {
    timestamps: true
});

export const Order = mongoose.model("Order", OrderSchema);