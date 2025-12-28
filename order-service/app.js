import express from 'express'

import orderRoutes from './routes/order.route.js'


export const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.use("/api/order", orderRoutes);
