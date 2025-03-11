import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * This API route handles linking an OAuth account to an existing user account
 * after the user has been authenticated via credentials
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { error: "You must be signed in to link accounts" },
        { status: 401 }
      );
    }

    const { provider, providerAccountId, accessToken, refreshToken, idToken } = await req.json();

    // Validate required fields
    if (!provider || !providerAccountId) {
      return NextResponse.json(
        { error: "Missing required provider information" },
        { status: 400 }
      );
    }

    // Link the account to the user
    const linkedAccount = await prisma.account.create({
      data: {
        userId: token.id as string,
        type: "oauth",
        provider,
        providerAccountId,
        access_token: accessToken,
        refresh_token: refreshToken,
        id_token: idToken,
        // Add any other fields required by your OAuth provider
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account linked successfully",
      provider
    });
  } catch (error) {
    console.error("Error linking account:", error);
    return NextResponse.json(
      { error: "Failed to link account" },
      { status: 500 }
    );
  }
} 