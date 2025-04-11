import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  // During build time, just return healthy
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    return NextResponse.json(
      { status: 'healthy', message: 'Build time check' },
      { status: 200 }
    );
  }

  try {
    // Check database connection only in runtime
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { status: 'healthy' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
} 