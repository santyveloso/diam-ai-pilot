import express from 'express';

const router = express.Router();

// Simple health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Auth service is running' });
});

export default router;