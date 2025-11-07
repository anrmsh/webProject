import express from 'express';
import { getAllHalls1 } from '../controllers/hallController.js';
const router = express.Router();

router.get('/halls', getAllHalls1); 
   
export default router;              