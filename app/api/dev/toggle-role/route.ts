import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    )
  }

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to toggle roles" },
        { status: 401 }
      )
    }

    // Get current user and role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Toggle role
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN"

    // Update user role in database
    await prisma.user.update({
      where: { id: user.id },
      data: { role: newRole },
    })

    return NextResponse.json({ success: true, newRole })
  } catch (error) {
    console.error("Error toggling role:", error)
    return NextResponse.json(
      { error: "Failed to toggle role" },
      { status: 500 }
    )
  }
} 