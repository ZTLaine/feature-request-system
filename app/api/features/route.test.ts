import { GET, POST } from "./route";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock the authOptions from the [...nextauth] route
jest.mock("../auth/[...nextauth]/route", () => ({
  authOptions: { providers: [] },
}));

// Define interfaces for our mocks
interface MockStatusChange {
  create: jest.Mock;
}

interface MockFeature {
  create: jest.Mock;
  findMany: jest.Mock;
}

interface MockPrismaClient {
  feature: MockFeature;
  statusChange: MockStatusChange;
  $transaction: jest.Mock;
  $disconnect: jest.Mock;
}

// Mock the PrismaClient
jest.mock("@prisma/client", () => {
  // Create mock with proper typing
  const mockPrismaClient: MockPrismaClient = {
    feature: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    statusChange: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((callback: (prisma: MockPrismaClient) => Promise<any>) => {
      return callback(mockPrismaClient);
    }),
    $disconnect: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe("Features API", () => {
  let mockPrismaClient: MockPrismaClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient() as unknown as MockPrismaClient;
  });

  describe("POST /api/features", () => {
    it("should create a new feature request successfully", async () => {
      // Arrange
      const requestBody = {
        title: "New Feature",
        description: "This is a new feature request",
      };
      
      const request = new Request("http://localhost:3000/api/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      });
      
      // Mock feature creation response
      const createdFeature = {
        id: "feature_123",
        title: requestBody.title,
        description: requestBody.description,
        creatorId: "user_123",
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };
      
      mockPrismaClient.feature.create.mockResolvedValue(createdFeature);
      mockPrismaClient.$transaction.mockImplementation(async (callback: (tx: MockPrismaClient) => Promise<any>) => {
        return await callback(mockPrismaClient);
      });
      
      // Act
      const response = await POST(request);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual(createdFeature);
      expect(getServerSession).toHaveBeenCalled();
      expect(mockPrismaClient.feature.create).toHaveBeenCalledWith({
        data: {
          title: requestBody.title,
          description: requestBody.description,
          creatorId: "user_123",
          status: "PENDING",
        },
      });
      expect(mockPrismaClient.statusChange.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          featureId: "feature_123",
          oldStatus: "PENDING",
          newStatus: "PENDING",
        }),
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const requestBody = {
        title: "New Feature",
        description: "This is a new feature request",
      };
      
      const request = new Request("http://localhost:3000/api/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      // Mock unauthenticated session
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // Act
      const response = await POST(request);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ 
        message: "You must be logged in to create a feature request" 
      });
      expect(mockPrismaClient.feature.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.statusChange.create).not.toHaveBeenCalled();
    });

    it("should return 400 if input validation fails", async () => {
      // Arrange
      const requestBody = {
        title: "", // Empty title, fails validation
        description: "This is a new feature request",
      };
      
      const request = new Request("http://localhost:3000/api/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      });
      
      // Act
      const response = await POST(request);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ message: "Invalid input" });
      expect(mockPrismaClient.feature.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.statusChange.create).not.toHaveBeenCalled();
    });

    it("should return 500 if a server error occurs", async () => {
      // Arrange
      const requestBody = {
        title: "New Feature",
        description: "This is a new feature request",
      };
      
      const request = new Request("http://localhost:3000/api/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      });
      
      // Mock transaction error
      mockPrismaClient.$transaction.mockRejectedValue(new Error("Database error"));
      
      // Act
      const response = await POST(request);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /api/features", () => {
    it("should retrieve all features successfully", async () => {
      // Arrange
      // Mock features return data
      const mockFeatures = [
        {
          id: "feature_1",
          title: "Feature 1",
          description: "Description 1",
          creatorId: "user_1",
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          vote: [{ id: "vote_1", userId: "user_2", featureId: "feature_1" }],
        },
        {
          id: "feature_2",
          title: "Feature 2",
          description: "Description 2",
          creatorId: "user_2",
          status: "IN_PROGRESS",
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          vote: [],
        },
      ];
      
      mockPrismaClient.feature.findMany.mockResolvedValue(mockFeatures);
      
      // Act
      const response = await GET();
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockFeatures);
      expect(mockPrismaClient.feature.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        include: {
          vote: true,
        },
        // orderBy: {
        //   vote: {
        //     _count: "desc",
        //   },
        // },
      });
    });

    it("should return 500 if a server error occurs during retrieval", async () => {
      // Arrange
      // Mock database error
      mockPrismaClient.feature.findMany.mockRejectedValue(new Error("Database error"));
      
      // Act
      const response = await GET();
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ message: "Internal server error" });
    });
  });
}); 