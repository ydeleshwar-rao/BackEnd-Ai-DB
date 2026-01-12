import { prisma } from '../../config/db.config';
import { ApiError } from '../../utils/ApiError';
import { CreateJobDTO } from './jobs.dto';

export async function createJob(data: CreateJobDTO) {
  if (!data.status || !data.job_type || !data.customer_id) {
    throw new ApiError(400, 'Invalid job data');
  }

  try {
    return await prisma.job.create({
      data: {
        customer_id: data.customer_id,
        status: data.status,
        job_type: data.job_type,
      },
    });
  } catch (error: any) {
    // foreign key error (customer not found)
    if (error.code === 'P2003') {
      throw new ApiError(404, 'Customer not found');
    }

    if (error.code === 'P2002') {
      throw new ApiError(409, 'Job already exists');
    }

    throw new ApiError(500, 'Database error');
  }
}

export async function getJobs() {
  return prisma.job.findMany({
    include: {
      customer: true, // optional but useful
    },
  });
}
