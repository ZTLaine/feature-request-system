import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ 
    message: 'Auth callback debug endpoint is working', 
    url: request.url,
    params: Object.fromEntries(new URL(request.url).searchParams),
    time: new Date().toISOString()
  });
} 