import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function PATCH(
  req: Request,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { status } = body

    const feature = await prisma.feature.findUnique({
      where: { id: params.featureId },
    })

    if (!feature) {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 })
    }

    // Create status change record
    await prisma.$transaction([
      prisma.statusChange.create({
        data: {
          featureId: params.featureId,
          oldStatus: feature.status,
          newStatus: status,
        },
      }),
      prisma.feature.update({
        where: { id: params.featureId },
        data: { status },
      }),
    ])

    return NextResponse.json({ message: "Status updated successfully" })
  } catch (error) {
    console.error("Status update error:", error)
    return NextResponse.json(
      { message: "Failed to update status" },
      { status: 500 }
    )
  }
} 