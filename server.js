import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDatabase } from './config/database.js'
import conversationRoutes from './routes/conversations.js'
import aiRoutes from './routes/ai.js'
import uploadRoutes from './routes/upload.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Connect to database
connectDatabase()

// Routes
app.use('/conversation', conversationRoutes)
app.use('/conversations', conversationRoutes)
app.use('/ask', aiRoutes)
app.use('/upload', uploadRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
