import { createApp } from './config/app.config';
import customerRoutes from './modules/customers/customers.routes';
import jobRoutes from './modules/jobs/jobs.routes';
import bookingRoutes from './modules/bookings/bookings.routes'
import aiRoutes  from './ai/api/ai.routes'
import { errorHandler } from './utils/errorHandler';

const app = createApp();

app.use('/api/customers', customerRoutes);
app.use('/api/jobs',jobRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use(errorHandler);

export default app;
