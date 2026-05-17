import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

// Auto-generate title from first user message if not set
conversationSchema.pre('save', function (next) {
  if (!this.title || this.title === 'New Chat') {
    const firstUserMessage = this.messages.find((m) => m.role === 'user')
    if (firstUserMessage) {
      // Truncate title to 50 characters
      this.title =
        firstUserMessage.content.substring(0, 50) +
        (firstUserMessage.content.length > 50 ? '...' : '')
    }
  }

  // Update lastMessage
  if (this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1]
    this.lastMessage = lastMsg.content.substring(0, 100)
  }

  next()
})

export const Conversation = mongoose.model('Conversation', conversationSchema)
