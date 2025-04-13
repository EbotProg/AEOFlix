import express from 'express';
import { downloadVideoController } from '../controllers/videoController';

const router = express.Router();
router.post('/download', downloadVideoController);

export default router;
