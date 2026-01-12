import { Request, Response, NextFunction } from 'express';
import * as bookingService from './bookings.service';
import { ApiResponse } from '../../utils/ApiResponse';


export async function createBookingController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const booking = await bookingService.createBooking(req.body);
    return ApiResponse(res, 201, 'Booking created', booking);
  } catch (error) {
    next(error);
  }
}


export async function getBookingsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const bookings = await bookingService.getBookings();
    return ApiResponse(res, 200, 'Bookings fetched', bookings);
  } catch (error) {
    next(error);
  }
}

