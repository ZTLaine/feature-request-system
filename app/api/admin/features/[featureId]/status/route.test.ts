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
import { PATCH } from "./route";

// Define interfaces for our mocks
interface MockFeature {
  findUnique: jest.Mock;
  update: jest.Mock;
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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    statusChange: {
      create: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.resolve(operations)),
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

describe("Admin Feature Status API", () => {
  let mockPrismaClient: MockPrismaClient;
  const mockRequest = (body: any) => {
    return {
      json: () => Promise.resolve(body),
    } as Request;
  };
  const mockParams = { featureId: "feature_123" };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient() as unknown as MockPrismaClient;
  });
  
  describe("PATCH /api/admin/features/[featureId]/status", () => {
    it("should update feature status for admin users", async () => {
      // Mock authenticated admin session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: "admin_user_id", 
          name: "Admin User", 
          email: "admin@example.com",
          role: UserRole.ADMIN,
        },
      });
      
      // Mock feature data
      const mockFeature = {
        id: "feature_123",
        title: "Test Feature",
        description: "Test Description",
        status: "PENDING",
        creatorId: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };
      
      // Setup mocks
      mockPrismaClient.feature.findUnique.mockResolvedValue(mockFeature);
      mockPrismaClient.statusChange.create.mockResolvedValue({
        id: "status_change_1",
        featureId: "feature_123",
        oldStatus: "PENDING",
        newStatus: "IN_PROGRESS",
        createdAt: new Date(),
      });
      mockPrismaClient.feature.update.mockResolvedValue({
        ...mockFeature,
        status: "IN_PROGRESS",
      });
      
      // Act
      const request = mockRequest({ status: "IN_PROGRESS" });
      const response = await PATCH(request, { params: mockParams });
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ message: "Status updated successfully" });
      
      // Verify findUnique was called with the right params
      expect(mockPrismaClient.feature.findUnique).toHaveBeenCalledWith({
        where: { id: mockParams.featureId },
      });
      
      // Verify $transaction was called 
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });
    
    it("should return 404 if feature is not found", async () => {
      // Mock authenticated admin session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: "admin_user_id", 
          name: "Admin User", 
          email: "admin@example.com",
          role: UserRole.ADMIN,
        },
      });
      
      // Setup mocks for feature not found
      mockPrismaClient.feature.findUnique.mockResolvedValue(null);
      
      // Act
      const request = mockRequest({ status: "IN_PROGRESS" });
      const response = await PATCH(request, { params: mockParams });
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ message: "Feature not found" });
      
      // Verify transaction was not called
      expect(mockPrismaClient.$transaction).not.toHaveBeenCalled();
    });
    
    it("should return 401 for unauthenticated users", async () => {
      // Mock unauthenticated session
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // Act
      const request = mockRequest({ status: "IN_PROGRESS" });
      const response = await PATCH(request, { params: mockParams });
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ message: "Unauthorized" });
      
      // Verify no db operations were called
      expect(mockPrismaClient.feature.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaClient.$transaction).not.toHaveBeenCalled();
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
      const request = mockRequest({ status: "IN_PROGRESS" });
      const response = await PATCH(request, { params: mockParams });
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(403);
      expect(responseData).toEqual({ message: "Forbidden" });
      
      // Verify no db operations were called
      expect(mockPrismaClient.feature.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaClient.$transaction).not.toHaveBeenCalled();
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
      
      // Mock feature data
      const mockFeature = {
        id: "feature_123",
        title: "Test Feature",
        description: "Test Description",
        status: "PENDING",
        creatorId: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };
      
      // Setup mocks
      mockPrismaClient.feature.findUnique.mockResolvedValue(mockFeature);
      mockPrismaClient.$transaction.mockRejectedValue(new Error("Database error"));
      
      // Act
      const request = mockRequest({ status: "IN_PROGRESS" });
      const response = await PATCH(request, { params: mockParams });
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ message: "Failed to update status" });
    });
  });
}); 