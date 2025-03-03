import { NextResponse } from "next/server";
import { POST } from "./route";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Mock the PrismaClient
jest.mock("@prisma/client", () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  hash: jest.fn(() => Promise.resolve("hashed_password")),
}));

describe("POST /api/auth/signup", () => {
  let mockPrismaClient: any;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient();
  });

  it("should create a new user successfully", async () => {
    // Arrange
    const requestBody = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };
    
    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    // Mock findUnique to return null (user doesn't exist)
    mockPrismaClient.user.findUnique.mockResolvedValue(null);
    
    // Mock create to return a new user
    mockPrismaClient.user.create.mockResolvedValue({
      id: "user_id_123",
      name: requestBody.name,
      email: requestBody.email,
      password: "hashed_password",
    });
    
    // Act
    const response = await POST(request);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(200);
    expect(responseData).toEqual({
      message: "User created successfully",
      user: {
        id: "user_id_123",
        name: requestBody.name,
        email: requestBody.email,
      },
    });
    expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
      where: { email: requestBody.email },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(requestBody.password, 10);
    expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
      data: {
        name: requestBody.name,
        email: requestBody.email,
        password: "hashed_password",
      },
    });
  });

  it("should return 400 if user already exists", async () => {
    // Arrange
    const requestBody = {
      name: "Existing User",
      email: "existing@example.com",
      password: "password123",
    };
    
    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    // Mock findUnique to return an existing user
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "existing_user_id",
      name: "Existing User",
      email: "existing@example.com",
      password: "hashed_password",
    });
    
    // Act
    const response = await POST(request);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(400);
    expect(responseData).toEqual({ message: "User already exists" });
    expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
      where: { email: requestBody.email },
    });
    expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
  });

  it("should return 400 if input validation fails", async () => {
    // Arrange
    const requestBody = {
      name: "A", // Too short for the schema (min 2)
      email: "invalid-email", // Invalid email format
      password: "12345", // Too short for the schema (min 6)
    };
    
    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    // Act
    const response = await POST(request);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(400);
    expect(responseData.message).toBe("Invalid input");
    expect(responseData.errors).toBeDefined();
    expect(mockPrismaClient.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
  });

  it("should handle missing fields in request body", async () => {
    // Arrange
    const requestBody = {
      // Missing name field
      email: "test@example.com",
      password: "password123",
    };
    
    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    // Act
    const response = await POST(request);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(400);
    expect(responseData.message).toBe("Invalid input");
    expect(responseData.errors).toBeDefined();
    expect(mockPrismaClient.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
  });

  it("should handle empty request body", async () => {
    // Arrange
    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    
    // Act
    const response = await POST(request);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(400);
    expect(responseData.message).toBe("Invalid input");
    expect(mockPrismaClient.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
  });

  it("should return 500 if an unexpected error occurs", async () => {
    // Arrange
    const requestBody = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };
    
    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    // Mock findUnique to return null (user doesn't exist)
    mockPrismaClient.user.findUnique.mockResolvedValue(null);
    
    // Mock create to throw an error
    mockPrismaClient.user.create.mockRejectedValue(new Error("Database error"));
    
    // Act
    const response = await POST(request);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(500);
    expect(responseData).toEqual({ message: "An error occurred during sign up" });
  });
}); 