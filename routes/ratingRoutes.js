import express from 'express';
import { rateHall } from '../controllers/ratingController.js';
import { authMiddleware } from '../middleware/middleware.js';

const router = express.Router();
router.post('/rate-hall', authMiddleware, rateHall);

export default router;