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

    console.log("Token from authenticated user:", token);
    const { provider, providerAccountId, accessToken, refreshToken, idToken } = await req.json();
    console.log("Received account linking request:", { provider, providerAccountId });

    // Validate required fields
    if (!provider || !providerAccountId) {
      return NextResponse.json(
        { error: "Missing required provider information" },
        { status: 400 }
      );
    }

    // Check if account already exists
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider,
        providerAccountId,
      }
    });

    if (existingAccount) {
      console.log("Account already exists:", existingAccount);
      
      // If the account exists but belongs to another user, handle accordingly
      if (existingAccount.userId !== token.id) {
        return NextResponse.json(
          { error: "This provider account is already linked to another user" },
          { status: 409 }
        );
      }
      
      // If it's already linked to this user, just return success
      return NextResponse.json({
        success: true,
        message: "Account already linked to this user",
        provider
      });
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
        // Add other required fields
        scope: "",
        token_type: "",
      },
    });

    console.log("Created linked account:", linkedAccount);

    return NextResponse.json({
      success: true,
      message: "Account linked successfully",
      provider
    });
  } catch (error) {
    console.error("Error linking account:", error);
    return NextResponse.json(
      { error: "Failed to link account", details: (error as Error).message },
      { status: 500 }
    );
  }
} 