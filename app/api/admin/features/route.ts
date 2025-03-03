import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../auth/[...nextauth]/route"

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
        votes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(features)
  } catch (error) {
    console.error("Admin features error:", error)
    return NextResponse.json(
      { message: "Failed to fetch features" },
      { status: 500 }
    )
  }
} 