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

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
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
          creatorId: user.id,
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
    const features = await prisma.feature.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        votes: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(features)
  } catch (error) {
    console.error("Error fetching features:", error)
    return NextResponse.json(
      { message: "Failed to fetch features" },
      { status: 500 }
    )
  }
}