import express from 'express'
import { cancelOrder, createOrder, getAllOrders, getOrderById, getOrdersByStatus } from '../controller/order.controller.js'

const router = express.Router()

router.get("/", getAllOrders)
router.post("/create", createOrder)
router.get("/:orderId", getOrderById)
router.get("/status/:status", getOrdersByStatus)
router.patch("/cancel/:orderId", cancelOrder); //Mevcut bir şeyin üzerinde ufak bir değişiklik yapmak. Sadece içindeki status alanını "PENDING" veya "SUCCESS" halinden "CANCELLED" haline getiriyorsun.
export default router