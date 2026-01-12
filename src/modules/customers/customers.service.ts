import { prisma } from '../../config/db.config';
import { ApiError } from '../../utils/ApiError';
import { CreateCustomerDTO } from './customers.dto';

export async function createCustomer(data: CreateCustomerDTO) {
  if (!data.name || !data.email || !data.phone || !data.address) {
    throw new ApiError(400, 'Invalid customer data');
  }

  try {
    return await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new ApiError(409, 'Customer already exists');
    }
    throw new ApiError(500, 'Database error');
  }
}


export async function getCustomers() {
  const customers = await prisma.customer.findMany({
    include: {
      jobs: {
        include: {
          bookings: {
            select: {
              booking_id: true,
              technician: true,
              scheduled_date: true,
            },
            orderBy: {
              scheduled_date: 'asc',
            },
          },
        },
      },
    },
  });

  return customers.map(customer => {
    let totalBookings = 0;

    const jobs = customer.jobs.map(job => {
      totalBookings += job.bookings.length;

      return {
        job_id: job.job_id,
        job_type: job.job_type,
        status: job.status,

        bookings_count: job.bookings.length,

        // 👇 booking details LLM ke liye
        bookings: job.bookings.map(booking => ({
          booking_id: booking.booking_id,
          technician: booking.technician,
          scheduled_date: booking.scheduled_date,
        })),

        // 👇 helpful AI hint
        next_scheduled_booking:
          job.bookings.length > 0
            ? job.bookings[0].scheduled_date
            : null,
      };
    });

    return {
      customer_id: customer.id,
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,

      total_jobs: jobs.length,
      total_bookings: totalBookings,

      jobs,
    };
  });
}
export async function deleteAllCustomers() {
  try {
    const result = await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.job.deleteMany(),
      prisma.customer.deleteMany(),
    ]);

    return {
      bookings_deleted: result[0].count,
      jobs_deleted: result[1].count,
      customers_deleted: result[2].count,
    };
  } catch (error) {
    console.error('DELETE ALL ERROR 👉', error);
    throw new ApiError(500, 'Failed to delete all customers');
  }
}
