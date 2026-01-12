import { Router } from 'express';
import {
  createJobController,
  getJobController,
} from './jobs.controller';

const router = Router();

router.post('/', createJobController);
router.get('/', getJobController);

export default router;
