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
  count: jest.Mock;
  groupBy: jest.Mock;
}

interface MockUser {
  count: jest.Mock;
}

interface MockVote {
  count: jest.Mock;
  groupBy: jest.Mock; 
}

interface MockStatusChange {
  groupBy: jest.Mock;
}

interface MockPrismaClient {
  feature: MockFeature;
  user: MockUser;
  vote: MockVote;
  statusChange: MockStatusChange;
  $disconnect: jest.Mock;
}

// Mock PrismaClient
jest.mock("@prisma/client", () => {
  const mockPrismaClient: MockPrismaClient = {
    feature: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    vote: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    statusChange: {
      groupBy: jest.fn(),
    },
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

describe("Admin Metrics API", () => {
  let mockPrismaClient: MockPrismaClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient() as unknown as MockPrismaClient;
    
    // Reset mocks with default successful responses
    mockPrismaClient.user.count.mockResolvedValue(25);
    mockPrismaClient.feature.count.mockResolvedValue(50);
    mockPrismaClient.vote.count.mockResolvedValue(120);
    mockPrismaClient.feature.groupBy.mockResolvedValue([
      { status: "PENDING", _count: 20 },
      { status: "IN_PROGRESS", _count: 15 },
      { status: "COMPLETED", _count: 10 },
      { status: "REJECTED", _count: 5 },
    ]);
    mockPrismaClient.statusChange.groupBy.mockResolvedValue([
      { createdAt: new Date("2023-01-01"), _count: 5 },
      { createdAt: new Date("2023-01-02"), _count: 8 },
      { createdAt: new Date("2023-01-03"), _count: 3 },
    ]);
    mockPrismaClient.vote.groupBy.mockResolvedValue([
      { featureId: "feature_1", _count: { featureId: 30 } },
      { featureId: "feature_2", _count: { featureId: 25 } },
      { featureId: "feature_3", _count: { featureId: 15 } },
    ]);
  });
  
  describe("GET /api/admin/metrics", () => {
    it("should return metrics data for admin users", async () => {
      // Mock authenticated admin session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: "admin_user_id", 
          name: "Admin User", 
          email: "admin@example.com",
          role: UserRole.ADMIN,
        },
      });
      
      // Act
      const response = await GET();
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        userCount: 25,
        featureCount: 50,
        voteCount: 120,
        statusDistribution: [
          { status: "PENDING", _count: 20 },
          { status: "IN_PROGRESS", _count: 15 },
          { status: "COMPLETED", _count: 10 },
          { status: "REJECTED", _count: 5 },
        ],
        statusChangesOverTime: [
          { createdAt: expect.any(Date), _count: 5 },
          { createdAt: expect.any(Date), _count: 8 },
          { createdAt: expect.any(Date), _count: 3 },
        ],
        popularFeatures: [
          { featureId: "feature_1", _count: { featureId: 30 } },
          { featureId: "feature_2", _count: { featureId: 25 } },
          { featureId: "feature_3", _count: { featureId: 15 } },
        ],
      });
      
      // Verify all database calls were made
      expect(mockPrismaClient.user.count).toHaveBeenCalled();
      expect(mockPrismaClient.feature.count).toHaveBeenCalled();
      expect(mockPrismaClient.vote.count).toHaveBeenCalled();
      expect(mockPrismaClient.feature.groupBy).toHaveBeenCalledWith({
        by: ["status"],
        _count: true,
      });
      expect(mockPrismaClient.statusChange.groupBy).toHaveBeenCalledWith({
        by: ["createdAt"],
        _count: true,
        where: {
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
      expect(mockPrismaClient.vote.groupBy).toHaveBeenCalledWith({
        by: ["featureId"],
        _count: true,
        orderBy: {
          _count: {
            featureId: "desc",
          },
        },
        take: 5,
      });
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
      
      // Verify no database calls were made
      expect(mockPrismaClient.user.count).not.toHaveBeenCalled();
      expect(mockPrismaClient.feature.count).not.toHaveBeenCalled();
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
      
      // Verify no database calls were made
      expect(mockPrismaClient.user.count).not.toHaveBeenCalled();
      expect(mockPrismaClient.feature.count).not.toHaveBeenCalled();
    });
    
    it("should return 500 with appropriate error message if user count fails", async () => {
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
      mockPrismaClient.user.count.mockRejectedValue(new Error("Database error"));
      
      // Act
      const response = await GET();
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ message: "Failed to fetch metrics" });
    });
    
    it("should return 500 with appropriate error message if feature groupBy fails", async () => {
      // Mock authenticated admin session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: "admin_user_id", 
          name: "Admin User", 
          email: "admin@example.com",
          role: UserRole.ADMIN,
        },
      });
      
      // All basic counts succeed but a groupBy operation fails
      mockPrismaClient.user.count.mockResolvedValue(25);
      mockPrismaClient.feature.count.mockResolvedValue(50);
      mockPrismaClient.vote.count.mockResolvedValue(120);
      mockPrismaClient.feature.groupBy.mockRejectedValue(new Error("Grouping error"));
      
      // Act
      const response = await GET();
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ message: "Failed to fetch metrics" });
    });
  });
}); 