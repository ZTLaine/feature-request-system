import { PrismaClient, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

// Mock NextAuth getServerSession
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock the authOptions directly instead of importing from [...nextauth] route
jest.mock("next-auth/next", () => ({
  NextAuthOptions: {}
}));

// Define mock authOptions
const mockAuthOptions = { providers: [] };

// Force mock any import of authOptions
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: mockAuthOptions
}), { virtual: true });

// Import our route handlers after mocks are set up
import { GET } from "./route";

// Define interfaces for our mocks
interface MockFeature {
  findMany: jest.Mock;
  update: jest.Mock;
  findUnique: jest.Mock;
}

interface MockStatusChange {
  create: jest.Mock;
}

interface MockPrismaClient {
  feature: MockFeature;
  statusChange: MockStatusChange;
  $transaction: jest.Mock;
  $disconnect: jest.Mock;
}

// Mock PrismaClient
jest.mock("@prisma/client", () => {
  const mockPrismaClient: MockPrismaClient = {
    feature: {
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    statusChange: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    $disconnect: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    UserRole: {
      USER: "USER" as UserRole,
      ADMIN: "ADMIN" as UserRole,
    }
  };
});

describe("Admin Features API", () => {
  let mockPrismaClient: MockPrismaClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient() as unknown as MockPrismaClient;
  });
  
  describe("GET /api/admin/features", () => {
    it("should return all features for admin users", async () => {
      // Mock authenticated admin session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: "admin_user_id", 
          name: "Admin User", 
          email: "admin@example.com",
          role: UserRole.ADMIN,
        },
      });
      
      // Mock features data
      const mockFeatures = [
        {
          id: "feature_1",
          title: "Feature 1",
          description: "Description 1",
          status: "PENDING",
          creatorId: "user_1",
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          votes: [{ id: "vote_1", userId: "user_2" }],
        },
        {
          id: "feature_2",
          title: "Feature 2",
          description: "Description 2",
          status: "IN_PROGRESS",
          creatorId: "user_2",
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          votes: [],
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
        include: { votes: true },
        orderBy: { createdAt: "desc" },
      });
      expect(getServerSession).toHaveBeenCalled();
    });
    
    it("should return 401 for unauthenticated users", async () => {
      // Mock unauthenticated session
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // Act
      const response = await GET();
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ message: "Unauthorized" });
      expect(mockPrismaClient.feature.findMany).not.toHaveBeenCalled();
    });
    
    it("should return 403 for non-admin users", async () => {
      // Mock authenticated but non-admin session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: "regular_user_id", 
          name: "Regular User", 
          email: "user@example.com",
          role: UserRole.USER,
        },
      });
      
      // Act
      const response = await GET();
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(403);
      expect(responseData).toEqual({ message: "Forbidden" });
      expect(mockPrismaClient.feature.findMany).not.toHaveBeenCalled();
    });
    
    it("should return 500 if a server error occurs", async () => {
      // Mock authenticated admin session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: "admin_user_id", 
          name: "Admin User", 
          email: "admin@example.com",
          role: UserRole.ADMIN,
        },
      });
      
      // Mock database error
      mockPrismaClient.feature.findMany.mockRejectedValue(new Error("Database error"));
      
      // Act
      const response = await GET();
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ message: "Failed to fetch features" });
    });
  });
}); 