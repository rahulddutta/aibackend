import express from 'express'
import axios from 'axios'
import multer from 'multer'
import FormData from 'form-data'

const router = express.Router()
const upload = multer()

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL ||
  'http://localhost:8000'

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'PDF file is required',
      })
    }

    const session_id = req.body?.session_id
    if (!session_id) {
      return res.status(400).json({
        error: 'Missing required fields',
      })
    }

    const form = new FormData()
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    })
    form.append('session_id', session_id)

    const response = await axios.post(
      `${PYTHON_BACKEND_URL}/upload`,
      form,
      {
        headers: form.getHeaders(),
      }
    )

    return res.json(response.data)
  } catch (error) {
    console.error(
      'Error in /upload endpoint:',
      error?.response?.data || error.message
    )

    return res.status(error.response?.status || 500).json({
      error:
        error.response?.data?.error ||
        'Failed to upload PDF',
    })
  }
})

router.get('/', async (req, res) => {
  const session_id = req.query.session_id
  if (!session_id) {
    return res.status(400).json({
      error: 'Missing required fields',
    })
  }

  try {
    const response = await axios.get(`${PYTHON_BACKEND_URL}/uploads`, {
      params: { session_id },
    })
    return res.json(response.data)
  } catch (error) {
    console.error('Error in /upload GET endpoint:', error?.response?.data || error.message)
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch uploads',
    })
  }
})

router.delete('/:filename', async (req, res) => {
  const session_id = req.query.session_id
  if (!session_id) {
    return res.status(400).json({
      error: 'Missing required fields',
    })
  }

  try {
    const { filename } = req.params
    const response = await axios.delete(
      `${PYTHON_BACKEND_URL}/uploads/${encodeURIComponent(filename)}`,
      {
        params: { session_id },
      }
    )
    return res.json(response.data)
  } catch (error) {
    console.error('Error in /upload DELETE endpoint:', error?.response?.data || error.message)
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete upload',
    })
  }
})

export default router
