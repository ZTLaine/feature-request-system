import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import * as z from "zod"
import { authOptions } from "../auth/[...nextauth]/route"
import crypto from "crypto"

// Add export const dynamic to prevent static generation error
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

const featureRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to create a feature request" }, 
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title, description } = featureRequestSchema.parse(body)

    // Use crypto or a similar function to generate IDs
    const featureId = crypto.randomUUID();
    const now = new Date();

    // Use transaction to create both feature and initial status change
    const feature = await prisma.$transaction(async (tx) => {
      const newFeature = await tx.feature.create({
        data: {
          id: featureId,
          title,
          description,
          creatorId: session.user.id,
          status: "PENDING", // Explicitly set initial status
          updatedAt: now,
        },
      })

      // Create initial status change record
      await tx.statusChange.create({
        data: {
          id: crypto.randomUUID(),
          featureId: newFeature.id,
          oldStatus: "PENDING",
          newStatus: "PENDING",
        },
      })

      return newFeature
    })

    return NextResponse.json(feature)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 })
    }
    console.error("Feature creation error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check session to determine if user can see features
    // and to check if they've voted on any features
    const session = await getServerSession(authOptions)
    
    // Get all non-deleted features
    const features = await prisma.feature.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        Vote: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        Vote: {
          _count: "desc",
        },
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
    console.error("Error fetching features:", error)
    return NextResponse.json(
      { message: "Failed to fetch features" },
      { status: 500 }
    )
  }
}