import { Router } from 'express';
import {
  createBookingController,
  getBookingsController,
} from './bookings.controller';

const router = Router();

router.post('/', createBookingController);
router.get('/', getBookingsController);


export default router;
