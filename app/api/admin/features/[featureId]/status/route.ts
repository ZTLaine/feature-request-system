import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../../../auth/[...nextauth]/route"

// Add export const dynamic to prevent static generation error
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      )
    }

    const { featureId } = params
    const { status } = await request.json()

    // Validate status
    const validStatuses = ["PENDING", "PLANNED", "IN_PROGRESS", "COMPLETED", "DENIED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      )
    }

    // Find the feature
    const feature = await prisma.feature.findUnique({
      where: {
        id: featureId,
      },
    })

    if (!feature) {
      return NextResponse.json(
        { message: "Feature not found" },
        { status: 404 }
      )
    }

    const oldStatus = feature.status
    
    // If status hasn't changed, return early
    if (oldStatus === status) {
      return NextResponse.json({ message: "Status unchanged" })
    }

    // Update feature status and create status change record in a transaction
    const result = await prisma.$transaction([
      prisma.feature.update({
        where: {
          id: featureId,
        },
        data: {
          status,
        },
      }),
      prisma.statusChange.create({
        data: {
          featureId,
          oldStatus,
          newStatus: status,
        },
      }),
    ])

    return NextResponse.json({
      message: "Status updated successfully",
      feature: result[0],
    })
  } catch (error) {
    console.error("Status update error:", error)
    return NextResponse.json(
      { message: "Failed to update status" },
      { status: 500 }
    )
  }
} 