import { prisma } from '../../config/db.config';
import { ApiError } from '../../utils/ApiError';
import { CreateBookingDTO } from './bookings.dto';


export async function createBooking(data: CreateBookingDTO) {
  if (!data.scheduled_date || !data.technician || !data.job_id) {
    throw new ApiError(400, 'Invalid booking data');
  }

  try {
    return await prisma.booking.create({
      data: {
        scheduled_date: new Date(data.scheduled_date),
        technician: data.technician,
        job_id: data.job_id,
      },
    });
  } catch (error: any) {
    // Job not found (foreign key error)
    if (error.code === 'P2003') {
      throw new ApiError(404, 'Job not found');
    }
    throw new ApiError(500, 'Database error');
  }
}


export async function getBookings() {
  return prisma.booking.findMany({
    include: {
      job: {
        include: {
          customer: true,
        },
      },
    },
  });
}


