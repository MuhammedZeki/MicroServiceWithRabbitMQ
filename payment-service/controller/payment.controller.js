import Payment from '../model/Payment.model.js';

// This is a placeholder controller.
// The main logic for payment creation will be triggered by RabbitMQ events.

/**
 * Get payment status by Order ID.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found for this order ID.' });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment status.', error: error.message });
  }
};
