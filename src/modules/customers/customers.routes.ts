import { Router } from 'express';
import {
  createCustomerController,
  getCustomersController,
  deleteAllCustomersController
  
} from './customers.controller';

const router = Router();

router.post('/', createCustomerController);
router.get('/All', getCustomersController);
router.delete('/Delete', deleteAllCustomersController);

export default router;
 
