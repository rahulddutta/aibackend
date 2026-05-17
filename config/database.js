import mongoose from 'mongoose'

export async function connectDatabase() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/aichatbox'

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}
