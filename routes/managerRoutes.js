import express from 'express';
import {
   getManagerHomePage,
   getHallStats
} from '../controllers/managerController.js';


const router = express.Router();

router.get('/',getManagerHomePage);
router.get('/hall-stats/:hallId', getHallStats);

export default router;