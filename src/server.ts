import app from './app';
import { connectDB } from './config/db.config';

const PORT = 3000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
