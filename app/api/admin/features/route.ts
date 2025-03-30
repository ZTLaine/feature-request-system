import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../auth/[...nextauth]/route"

// Add export const dynamic to prevent static generation error
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const features = await prisma.feature.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        Vote: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the response to maintain compatibility with frontend
    const transformedFeatures = features.map(feature => {
      // Create a new object with all the original properties
      const transformedFeature = { ...feature };
      // Add the votes property for frontend compatibility
      transformedFeature.votes = feature.Vote;
      return transformedFeature;
    });

    return NextResponse.json(transformedFeatures)
  } catch (error) {
    console.error("Admin features error:", error)
    return NextResponse.json(
      { message: "Failed to fetch features" },
      { status: 500 }
    )
  }
} 