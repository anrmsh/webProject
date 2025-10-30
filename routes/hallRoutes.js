import express from 'express';
import { getAllHalls1 } from '../controllers/hallController.js';
const router = express.Router();

// router.get('/halls', getAllHalls);
router.get('/halls', getAllHalls1); 
//router.get('/halls/:id', getHallDetails);

    
export default router;              