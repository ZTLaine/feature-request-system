import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
  req: Request,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const featureId = params.featureId
    const userId = session.user.id

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