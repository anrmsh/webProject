import express from 'express';
import {getProfilePage,
    getEditProfile,
    postEditProfile,
    getEditBooking,
    postEditBooking,
    cancelWaiting
} from '../controllers/clientController.js';
import { authMiddleware, requireAuth } from '../middleware/middleware.js';
  
const router = express.Router();

router.get('/profile', authMiddleware, getProfilePage);
    
router.get('/edit-profile', requireAuth, getEditProfile);
router.post('/edit-profile', requireAuth, postEditProfile);

router.get('/edit-booking/:id', requireAuth, getEditBooking);
router.post('/edit-booking/:id', requireAuth, postEditBooking);

router.patch('/cancel-waiting/:id', authMiddleware, cancelWaiting);
       
export default router;    

