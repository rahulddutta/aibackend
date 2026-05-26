import express from 'express'
import axios from 'axios'
import { Conversation } from '../models/Conversation.js'

const router = express.Router()

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL ||
  'http://localhost:8000'

router.post('/', async (req, res) => {

  try {

    const {
      conversationId,
      messages,
      session_id,
    } = req.body

    if (!conversationId || !messages || !session_id) {
      return res.status(400).json({
        error: 'Missing required fields',
      })
    }

    // Find or create conversation
    let conversation =
      await Conversation.findOne({
        conversationId,
        session_id,
      })

    if (!conversation) {

      conversation = new Conversation({
        conversationId,
        session_id,
        title: 'New Chat',
        messages: [],
      })
    }

    // Generate title from first message
    if (
      conversation.title === 'New Chat' &&
      messages.length > 0
    ) {
      conversation.title =
        messages[0].content.slice(0, 40)
    }

    // Get AI response
    const answer = await getAIResponse(
      conversationId,
      messages,
      session_id
    )

    // Assistant message
    const assistantMessage = {
      role: 'assistant',
      content: answer,
      timestamp: Date.now(),
    }

    // Save full conversation
    conversation.messages = [
      ...messages,
      assistantMessage,
    ]

    await conversation.save()

    // Return response
    res.json({
      answer,
      conversationId,
      session_id,
      messages: conversation.messages,
    })

  } catch (error) {

    console.error(
      'Error in /ask endpoint:',
      error
    )

    res.status(500).json({
      error: 'Failed to process request',
    })
  }
})

// Streaming endpoint
router.post('/stream', async (req, res) => {
  try {
    const {
      conversationId,
      messages,
      session_id,
    } = req.body

    if (!conversationId || !messages || !session_id) {
      return res.status(400).json({
        error: 'Missing required fields',
      })
    }

    // Find or create conversation
    let conversation =
      await Conversation.findOne({
        conversationId,
        session_id,
      })

    if (!conversation) {
      conversation = new Conversation({
        conversationId,
        session_id,
        title: 'New Chat',
        messages: [],
      })
    }

    // Generate title from first message
    if (
      conversation.title === 'New Chat' &&
      messages.length > 0
    ) {
      conversation.title =
        messages[0].content.slice(0, 40)
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    try {
      console.log(
        `Calling Python streaming backend at ${PYTHON_BACKEND_URL}/ask/stream`
      )

      const response = await axios.post(
        `${PYTHON_BACKEND_URL}/ask/stream`,
        {
          conversationId,
          session_id,
          messages,
        },
        {
          responseType: 'stream',
        }
      )

      let fullAnswer = ''

      // Forward stream to client
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6)
              const parsed = JSON.parse(jsonStr)
              fullAnswer += parsed.chunk || ''
              res.write(line + '\n')
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      })

      response.data.on('end', async () => {
        // Save conversation with full answer
        const assistantMessage = {
          role: 'assistant',
          content: fullAnswer,
          timestamp: Date.now(),
        }

        conversation.messages = [
          ...messages,
          assistantMessage,
        ]

        await conversation.save()

        res.write(
          `data: ${JSON.stringify({
            chunk: '',
            done: true,
            conversationId,
            session_id,
          })}\n\n`
        )
        res.end()
      })

      response.data.on('error', (error) => {
        console.error('Stream error:', error)
        res.write(
          `data: ${JSON.stringify({
            error: 'Stream error',
          })}\n\n`
        )
        res.end()
      })
    } catch (error) {
      console.error(
        'Error calling Python streaming backend:',
        error.message
      )

      if (error.code === 'ECONNREFUSED') {
        res.write(
          `data: ${JSON.stringify({
            error: `AI service unavailable. Please ensure Python backend is running at ${PYTHON_BACKEND_URL}`,
          })}\n\n`
        )
      } else {
        res.write(
          `data: ${JSON.stringify({
            error:
              error.response?.data?.error ||
              error.message,
          })}\n\n`
        )
      }
      res.end()
    }
  } catch (error) {
    console.error(
      'Error in /ask/stream endpoint:',
      error
    )

    res.status(500).json({
      error: 'Failed to process request',
    })
  }
})

async function getAIResponse(
  conversationId,
  messages,
  session_id
) {

  try {

    console.log(
      `Calling Python backend at ${PYTHON_BACKEND_URL}/ask`
    )

    const response = await axios.post(
      `${PYTHON_BACKEND_URL}/ask`,
      {
        conversationId,
        session_id,
        messages,
      }
    )

    return (
      response.data.answer ||
      'No response from AI'
    )

  } catch (error) {

    console.error(
      'Error calling Python backend:',
      error.message
    )

    if (error.code === 'ECONNREFUSED') {

      return `AI service unavailable. Please ensure Python backend is running at ${PYTHON_BACKEND_URL}`
    }

    return (
      'Error: ' +
      (
        error.response?.data?.error ||
        error.message
      )
    )
  }
}

export default router