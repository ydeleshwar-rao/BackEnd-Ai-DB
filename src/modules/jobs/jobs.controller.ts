import { Response, Request, NextFunction } from 'express';
import { ApiResponse } from '../../utils/ApiResponse';
import * as jobService from './jobs.service';

export async function createJobController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const job = await jobService.createJob(req.body);
    return ApiResponse(res, 201, 'Job Created', job);
  } catch (error) {
    next(error);
  }
}

export async function getJobController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const jobs = await jobService.getJobs();
    return ApiResponse(res, 200, 'Job fetched', jobs);
  } catch (error) {
    next(error);
  }
}
