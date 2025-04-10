import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import * as z from "zod"
import crypto from "crypto"

const prisma = new PrismaClient()

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = signUpSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = crypto.randomUUID()
    const now = new Date()

    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    })

    return NextResponse.json({
      message: "User created successfully",
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input", errors: error.errors }, { status: 400 })
    }
    console.error("Signup error:", error)
    return NextResponse.json({ message: "An error occurred during sign up" }, { status: 500 })
  }
}

