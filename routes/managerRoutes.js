import express from 'express';
import {
   getManagerHomePage,
   getHallStats,
   getRatingsPage,
   getRatingsData,
   getManagerBookings,
   getManagerShedulePage,
   getRegisterHallPage,
   postRegisterHall

} from '../controllers/managerController.js';


const router = express.Router();

router.get('/',getManagerHomePage);
router.get('/hall-stats/:hallId', getHallStats);
router.get("/ratings", getRatingsPage);
router.get("/ratings/data", getRatingsData);
router.get('/schedule', getManagerShedulePage);
router.get('/bookings', getManagerBookings);

router.get('/register-hall', getRegisterHallPage);
router.post('/register-hall', postRegisterHall);

export default router;