import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import * as z from "zod"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

const featureRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to create a feature request" }, 
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title, description } = featureRequestSchema.parse(body)

    const feature = await prisma.feature.create({
      data: {
        title,
        description,
        creatorId: session.user.id,
      },
    })

    return NextResponse.json(feature)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 })
    }
    console.error("Feature creation error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const features = await prisma.feature.findMany({
      where: { isDeleted: false },
      include: {
        votes: true,
      },
      orderBy: {
        votes: {
          _count: "desc",
        },
      },
    })

    return NextResponse.json(features)
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}