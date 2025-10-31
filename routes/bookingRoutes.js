import express from 'express';
import { getHallDetails, createBooking, addToWaitingList, updateStatusBookingConfirm, cancelBooking, autoCancelBookings, updateBooking, getBookingDetails, getHallBookingsByDate } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/middleware.js';


const router = express.Router();



router.get('/halls/:id', getHallDetails);
router.post('/bookings', requireAuth, createBooking);
router.get('/bookings/slots', getHallBookingsByDate);

router.post('/waiting-list', requireAuth, addToWaitingList);
router.patch('/confirm-booking/:id', updateStatusBookingConfirm);

router.patch('/cancel-booking/:id', cancelBooking);
router.patch('/auto-cancel-bookings', autoCancelBookings);

router.get('/edit-booking/:id', getBookingDetails);
router.post('/edit-booking/:id', updateBooking);
export default router; 