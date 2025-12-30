import { Router } from 'express';
import { getPaymentByOrderId } from '../controller/payment.controller.js';

const router = Router();

// Example route to check payment status for a given order
router.get('/status/:orderId', getPaymentByOrderId);

export default router;
