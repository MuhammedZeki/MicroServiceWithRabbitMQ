import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // orderId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Order',
  //   required: true,
  //   index: true,
  // },
  orderId: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE', "REFUNDED", "CANCELLED"],
    default: 'PENDING',
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentGatewayMessage: {
    type: String,
  },
  processedMessageIds: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

// Update `updatedAt` field before saving
paymentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
