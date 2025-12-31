import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE'],
    default: 'PENDING',
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentGatewayMessage: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  processedMessageIds: {
    type: [String],
    default: [],
  },
});

// Update `updatedAt` field before saving
paymentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
