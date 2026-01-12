import express from 'express';
import cors from 'cors';
import { errorHandler } from '../utils/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json());

  return app;
}
