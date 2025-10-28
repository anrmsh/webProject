import express from 'express';
import { showHomePage } from '../controllers/mainController.js';
import { authMiddleware } from '../middleware/middleware.js';

const router = express.Router();
router.get('/index',authMiddleware, showHomePage);

export default router;       