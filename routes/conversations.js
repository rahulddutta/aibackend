import express from 'express'
import { Conversation } from '../models/Conversation.js'

const router = express.Router()

function getSessionId(req, res) {
  const sessionId = req.query.session_id || req.body?.session_id
  if (!sessionId) {
    res.status(400).json({ error: 'Missing required fields' })
    return null
  }
  return sessionId
}

// GET /conversations - Get all conversations
router.get('/', async (req, res) => {
  try {
    const session_id = getSessionId(req, res)
    if (!session_id) {
      return
    }

    const conversations = await Conversation.find({ session_id })
      .sort({ updatedAt: -1 })
      .select('conversationId title lastMessage updatedAt')
      .limit(100)

    res.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// POST /conversations - Create new conversation
router.post('/', async (req, res) => {
  try {
    const { conversationId, session_id } = req.body
    if (!session_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const newConversationId =
      conversationId || require('crypto').randomUUID()

    const conversation = new Conversation({
      conversationId: newConversationId,
      session_id,
      title: 'New Chat',
      messages: [],
    })

    await conversation.save()

    res.json({
      conversationId: newConversationId,
      title: 'New Chat',
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

// GET /conversation/:conversationId - Get specific conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const session_id = getSessionId(req, res)
    if (!session_id) {
      return
    }

    const { conversationId } = req.params

    let conversation = await Conversation.findOne({ conversationId, session_id })

    if (!conversation) {
      conversation = new Conversation({
        conversationId,
        session_id,
        title: 'New Chat',
        messages: [],
      })
      await conversation.save()
    }

    res.json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    res.status(500).json({ error: 'Failed to fetch conversation' })
  }
})

// PUT /conversation/:conversationId - Update conversation title
router.put('/:conversationId', async (req, res) => {
  try {
    const session_id = getSessionId(req, res)
    if (!session_id) {
      return
    }

    const { conversationId } = req.params
    const { title } = req.body

    const conversation = await Conversation.findOneAndUpdate(
      { conversationId, session_id },
      { title },
      { new: true }
    )

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    res.json(conversation)
  } catch (error) {
    console.error('Error updating conversation:', error)
    res.status(500).json({ error: 'Failed to update conversation' })
  }
})

// DELETE /conversation/:conversationId - Delete conversation
router.delete('/:conversationId', async (req, res) => {
  try {
    const session_id = getSessionId(req, res)
    if (!session_id) {
      return
    }

    const { conversationId } = req.params

    await Conversation.findOneAndDelete({ conversationId, session_id })

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
})

export default router
