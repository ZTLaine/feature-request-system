import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function DELETE(
  req: Request,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const feature = await prisma.feature.findUnique({
      where: { id: params.featureId },
    })

    if (!feature) {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 })
    }

    // Check if user is creator
    if (feature.creatorId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
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
    console.error("Delete feature error:", error)
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
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const featureId = params.featureId
    const userId = session.user.id

    // Check if feature exists
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
    })

    if (!feature) {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 })
    }

    // Check if vote exists
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_featureId: {
          userId,
          featureId,
        },
      },
    })

    if (existingVote) {
      // Remove vote if it exists
      await prisma.vote.delete({
        where: {
          userId_featureId: {
            userId,
            featureId,
          },
        },
      })
    } else {
      // Create vote if it doesn't exist
      await prisma.vote.create({
        data: {
          userId,
          featureId,
        },
      })
    }

    return NextResponse.json({ message: "Vote updated successfully" })
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json(
      { message: "Failed to update vote" },
      { status: 500 }
    )
  }
} 