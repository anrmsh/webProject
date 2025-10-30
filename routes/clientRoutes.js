import express from 'express';
import {getProfilePage,
    getEditProfile,
    postEditProfile,
    getEditBooking,
    postEditBooking
} from '../controllers/clientController.js';
import { authMiddleware, requireAuth } from '../middleware/middleware.js';
  
const router = express.Router();

//router.use(authMiddleware);
router.get('/profile', authMiddleware, getProfilePage);
    
router.get('/edit-profile', requireAuth, getEditProfile);
router.post('/edit-profile', requireAuth, postEditProfile);

router.get('/edit-booking/:id', requireAuth, getEditBooking);
router.post('/edit-booking/:id', requireAuth, postEditBooking);
       
export default router;    

