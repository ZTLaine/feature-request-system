import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get counts by status
    const statusCounts = await prisma.feature.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      where: {
        isDeleted: false,
      },
    })

    // Get status changes with timestamps
    const statusChanges = await prisma.statusChange.findMany({
      include: {
        feature: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Calculate average duration for each status
    const durationsByStatus = new Map<string, { totalDays: number; count: number }>()

    // Process status changes to calculate durations
    statusChanges.forEach((change, index) => {
      const startDate = change.createdAt
      let endDate: Date

      // Find the next status change for this feature
      const nextChange = statusChanges.find(
        (sc, i) => i > index && sc.featureId === change.featureId
      )

      // If there's no next change, use current date as end date
      endDate = nextChange ? nextChange.createdAt : new Date()

      const durationInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

      // Add duration to old status
      const oldStatusData = durationsByStatus.get(change.oldStatus) || { totalDays: 0, count: 0 }
      oldStatusData.totalDays += durationInDays
      oldStatusData.count += 1
      durationsByStatus.set(change.oldStatus, oldStatusData)
    })

    // Add current status durations for features without subsequent changes
    const features = await prisma.feature.findMany({
      where: {
        isDeleted: false,
      },
    })

    features.forEach(feature => {
      const lastChange = statusChanges
        .filter(sc => sc.featureId === feature.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

      const startDate = lastChange ? lastChange.createdAt : feature.createdAt
      const durationInDays = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

      const currentStatusData = durationsByStatus.get(feature.status) || { totalDays: 0, count: 0 }
      currentStatusData.totalDays += durationInDays
      currentStatusData.count += 1
      durationsByStatus.set(feature.status, currentStatusData)
    })

    // Combine counts and durations
    const metrics = statusCounts.map((statusCount) => {
      const durationData = durationsByStatus.get(statusCount.status) || { totalDays: 0, count: 0 }
      const averageDuration = durationData.count > 0 
        ? durationData.totalDays / durationData.count 
        : 0

      return {
        status: statusCount.status,
        count: statusCount._count.status,
        averageDuration,
      }
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Admin metrics error:", error)
    return NextResponse.json(
      { message: "Failed to fetch metrics" },
      { status: 500 }
    )
  }
} 