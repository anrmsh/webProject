import express from 'express';
import { getHallDetails, createBooking, addToWaitingList } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/halls/:id', getHallDetails);
router.post('/bookings', requireAuth, createBooking);
router.post('/waiting-list', requireAuth, addToWaitingList);

export default router; 