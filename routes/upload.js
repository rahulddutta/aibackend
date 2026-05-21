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

    const form = new FormData()
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    })

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

export default router
