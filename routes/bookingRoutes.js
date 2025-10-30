import express from 'express';
import { getHallDetails, createBooking, addToWaitingList,updateStatusBookingConfirm } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/middleware.js';


const router = express.Router();



router.get('/halls/:id', getHallDetails);
router.post('/bookings', requireAuth, createBooking);
router.post('/waiting-list', requireAuth, addToWaitingList);
router.patch('/confirm-booking/:id',updateStatusBookingConfirm);

export default router; 