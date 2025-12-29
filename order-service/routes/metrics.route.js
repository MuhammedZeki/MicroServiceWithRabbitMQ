import express from 'express'
import { register } from '../metrics/metrics.js'

const router = express.Router()

router.get("/", async (req, res) => {
    res.set("Content-Type", register.contentType)
    res.end(await register.metrics())
})

export default router