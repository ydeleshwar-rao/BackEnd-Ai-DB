import express from 'express';
import cors from 'cors';
import { errorHandler } from '../utils/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: 'https://front-end-ai-db.vercel.app/',
    credentials: true
  }));
  app.use(express.json());

  return app;
}
