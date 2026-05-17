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
    } = req.body

    if (!conversationId || !messages) {
      return res.status(400).json({
        error: 'Missing required fields',
      })
    }

    // Find or create conversation
    let conversation =
      await Conversation.findOne({
        conversationId,
      })

    if (!conversation) {

      conversation = new Conversation({
        conversationId,
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
      messages
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

async function getAIResponse(
  conversationId,
  messages
) {

  try {

    console.log(
      `Calling Python backend at ${PYTHON_BACKEND_URL}/ask`
    )

    const response = await axios.post(
      `${PYTHON_BACKEND_URL}/ask`,
      {
        conversationId,
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