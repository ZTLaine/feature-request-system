import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

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

    // Get total user count
    const userCount = await prisma.user.count()

    // Get total feature count
    const featureCount = await prisma.feature.count()

    // Get total vote count
    const voteCount = await prisma.vote.count()

    // Get features by status
    const statusDistribution = await prisma.feature.groupBy({
      by: ["status"],
      _count: true,
    })

    // Get status changes over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const statusChangesOverTime = await prisma.statusChange.groupBy({
      by: ["createdAt"],
      _count: true,
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Get most voted features
    const popularFeatures = await prisma.vote.groupBy({
      by: ["featureId"],
      _count: true,
      orderBy: {
        _count: {
          featureId: "desc",
        },
      },
      take: 5,
    })

    return NextResponse.json({
      userCount,
      featureCount,
      voteCount,
      statusDistribution,
      statusChangesOverTime,
      popularFeatures,
    })
  } catch (error) {
    console.error("Metrics error:", error)
    return NextResponse.json(
      { message: "Failed to fetch metrics" },
      { status: 500 }
    )
  }
} 