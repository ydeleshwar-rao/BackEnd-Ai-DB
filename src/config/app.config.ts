import express from 'express';
import cors from 'cors';
import { errorHandler } from '../utils/errorHandler';

export function createApp() {
  const app = express();

  const allowedOrigins = [
    'https://front-end-ai-db.vercel.app',
    'http://localhost:5173',
    'http://localhost:4000'
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    })
  );

  app.use(express.json());

  return app;
}
