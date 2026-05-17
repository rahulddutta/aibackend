import express from 'express'
import { Conversation } from '../models/Conversation.js'

const router = express.Router()

// GET /conversations - Get all conversations
router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find()
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
    const { conversationId } = req.body
    const newConversationId =
      conversationId || require('crypto').randomUUID()

    const conversation = new Conversation({
      conversationId: newConversationId,
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
    const { conversationId } = req.params

    let conversation = await Conversation.findOne({ conversationId })

    if (!conversation) {
      // Create a new conversation if it doesn't exist
      conversation = new Conversation({
        conversationId,
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
    const { conversationId } = req.params
    const { title } = req.body

    const conversation = await Conversation.findOneAndUpdate(
      { conversationId },
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
    const { conversationId } = req.params

    await Conversation.findOneAndDelete({ conversationId })

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
})

export default router
