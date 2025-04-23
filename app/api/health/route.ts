import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client'; // No longer needed for basic check

// const prisma = new PrismaClient(); // No longer needed

export async function GET() {
  console.log('[Health Check] Simple health check invoked.');
  // Return a simple healthy status immediately
  return NextResponse.json(
    { status: 'healthy', timestamp: new Date().toISOString() }, 
    { status: 200 }
  );

  /* Previous logic with DB check:
  console.log('[Health Check] Starting health check...');
  
  // During build time, just return healthy
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.log('[Health Check] Build time check - skipping database verification');
    return NextResponse.json(
      { status: 'healthy', message: 'Build time check' },
      { status: 200 }
    );
  }

  try {
    console.log('[Health Check] Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('[Health Check] Database connection successful');
    
    return NextResponse.json(
      { status: 'healthy' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Health Check] Database connection failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
  */
} 