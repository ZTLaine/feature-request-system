import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../auth/[...nextauth]/route"

// Add export const dynamic to prevent static generation error
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function DELETE(
  req: Request,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const feature = await prisma.feature.findUnique({
      where: { id: params.featureId },
    })

    if (!feature) {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 })
    }

    // Check if user is the creator or an admin
    if (feature.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: You can only delete your own features" }, { status: 403 })
    }

    // Soft delete
    await prisma.feature.update({
      where: { id: params.featureId },
      data: { 
        isDeleted: true,
        deletedAt: new Date()
      },
    })

    return NextResponse.json({ message: "Feature request deleted" })
  } catch (error) {
    console.error("Error deleting feature:", error)
    return NextResponse.json(
      { message: "Failed to delete feature" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { featureId } = params
    
    // Check if feature exists
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
    })
    
    if (!feature) {
      return NextResponse.json(
        { message: "Feature not found" },
        { status: 404 }
      )
    }
    
    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_featureId: {
          userId: session.user.id,
          featureId,
        },
      },
    })
    
    if (existingVote) {
      // Remove vote if it already exists (toggle behavior)
      await prisma.vote.delete({
        where: {
          id: existingVote.id,
        },
      })
      return NextResponse.json({ message: "Vote removed" })
    }
    
    // Create new vote
    await prisma.vote.create({
      data: {
        userId: session.user.id,
        featureId,
      },
    })
    
    return NextResponse.json({ message: "Vote added" })
  } catch (error) {
    console.error("Error voting on feature:", error)
    return NextResponse.json(
      { message: "Failed to vote on feature" },
      { status: 500 }
    )
  }
} 