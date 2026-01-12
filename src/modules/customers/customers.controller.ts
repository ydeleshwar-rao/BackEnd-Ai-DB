import { Request, Response, NextFunction } from 'express';
import * as customerService from './customers.service';
import { ApiResponse } from '../../utils/ApiResponse';

/**
 * CREATE CUSTOMER
 */
export async function createCustomerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const customer = await customerService.createCustomer(req.body);
    return ApiResponse(res, 201, 'Customer created', customer);
  } catch (error) {
    next(error);
  }
}

/**
 * GET ALL CUSTOMERS
 * (LLM-READY RESPONSE: jobs + bookings + technician + scheduled_date)
 */
export async function getCustomersController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const customers = await customerService.getCustomers();
    return ApiResponse(res, 200, 'Customers fetched', customers);
  } catch (error) {
    next(error);
  }
}

export async function deleteAllCustomersController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await customerService.deleteAllCustomers();

    return ApiResponse(
      res,
      200,
      'All customers, jobs and bookings deleted',
      result
    );
  } catch (error) {
    console.error('CONTROLLER ERROR 👉', error);
    next(error);
  }
}
