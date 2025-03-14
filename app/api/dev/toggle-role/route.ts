import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../auth/[...nextauth]/route"

// Add export const dynamic to prevent static generation error
export const dynamic = 'force-dynamic'

// Development-only route to toggle the user's role between USER and ADMIN
// This is for testing purposes only
const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ message: "Not allowed in production" }, { status: 403 })
    }
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    
    // Toggle the role
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    
    await prisma.user.update({
      where: { id: user.id },
      data: { role: newRole },
    })
    
    return NextResponse.json({ message: `Role updated to ${newRole}` })
  } catch (error) {
    console.error("Toggle role error:", error)
    return NextResponse.json({ message: "Failed to toggle role" }, { status: 500 })
  }
} 