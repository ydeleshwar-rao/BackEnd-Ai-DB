import { PrismaClient } from '@prisma/client';


export const prisma = new PrismaClient({
      log: ['query', 'error', 'warn'], 
});



export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
}