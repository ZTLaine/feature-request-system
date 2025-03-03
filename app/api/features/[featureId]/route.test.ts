import { NextResponse } from "next/server";
import { DELETE, POST } from "./route";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock the authOptions from the [...nextauth] route
jest.mock("../../auth/[...nextauth]/route", () => ({
  authOptions: { providers: [] },
}));

// Define interfaces for our mocks
interface MockFeature {
  findUnique: jest.Mock;
  update: jest.Mock;
}

interface MockVote {
  findUnique: jest.Mock;
  create: jest.Mock;
  delete: jest.Mock;
}

interface MockPrismaClient {
  feature: MockFeature;
  vote: MockVote;
  $disconnect: jest.Mock;
}

// Mock the PrismaClient
jest.mock("@prisma/client", () => {
  // Create mock with proper typing
  const mockPrismaClient: MockPrismaClient = {
    feature: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe("Feature ID API", () => {
  let mockPrismaClient: MockPrismaClient;
  const featureId = "feature_123";
  const mockParams = { params: { featureId } };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient() as unknown as MockPrismaClient;
  });

  describe("DELETE /api/features/[featureId]", () => {
    it("should successfully soft delete a feature", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "DELETE",
      });

      // Mock authenticated session with user as creator
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      });
      
      // Mock finding the feature
      const mockFeature = {
        id: featureId,
        title: "Feature to Delete",
        description: "This feature will be deleted",
        creatorId: "user_123", // Same as session user
        status: "PENDING",
        isDeleted: false,
      };
      
      mockPrismaClient.feature.findUnique.mockResolvedValue(mockFeature);
      mockPrismaClient.feature.update.mockResolvedValue({
        ...mockFeature,
        isDeleted: true,
        deletedAt: expect.any(Date),
      });
      
      // Act
      const response = await DELETE(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ message: "Feature request deleted" });
      expect(mockPrismaClient.feature.findUnique).toHaveBeenCalledWith({
        where: { id: featureId },
      });
      expect(mockPrismaClient.feature.update).toHaveBeenCalledWith({
        where: { id: featureId },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "DELETE",
      });

      // Mock unauthenticated session
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // Act
      const response = await DELETE(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ message: "Unauthorized" });
      expect(mockPrismaClient.feature.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaClient.feature.update).not.toHaveBeenCalled();
    });

    it("should return 404 when feature does not exist", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "DELETE",
      });

      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      });
      
      // Mock feature not found
      mockPrismaClient.feature.findUnique.mockResolvedValue(null);
      
      // Act
      const response = await DELETE(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ message: "Feature not found" });
      expect(mockPrismaClient.feature.update).not.toHaveBeenCalled();
    });

    it("should return 403 when user is not the creator", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "DELETE",
      });

      // Mock authenticated session with different user ID
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "different_user", name: "Other User", email: "other@example.com" },
      });
      
      // Mock finding the feature with different creator
      mockPrismaClient.feature.findUnique.mockResolvedValue({
        id: featureId,
        title: "Feature to Delete",
        description: "This feature will be deleted",
        creatorId: "user_123", // Different from session user
        status: "PENDING",
        isDeleted: false,
      });
      
      // Act
      const response = await DELETE(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(403);
      expect(responseData).toEqual({ message: "Unauthorized" });
      expect(mockPrismaClient.feature.update).not.toHaveBeenCalled();
    });

    it("should return 500 if a server error occurs", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "DELETE",
      });

      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      });
      
      // Mock finding the feature
      mockPrismaClient.feature.findUnique.mockResolvedValue({
        id: featureId,
        title: "Feature to Delete",
        description: "This feature will be deleted",
        creatorId: "user_123", // Same as session user
        status: "PENDING",
        isDeleted: false,
      });
      
      // Mock update to throw an error
      mockPrismaClient.feature.update.mockRejectedValue(new Error("Database error"));
      
      // Act
      const response = await DELETE(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ message: "Failed to delete feature" });
    });
  });

  describe("POST /api/features/[featureId] (Vote Toggle)", () => {
    it("should add a vote when one doesn't exist", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "POST",
      });

      // Mock authenticated session
      const userId = "user_123";
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: userId, name: "Test User", email: "test@example.com" },
      });
      
      // Mock finding the feature
      mockPrismaClient.feature.findUnique.mockResolvedValue({
        id: featureId,
        title: "Feature to Vote On",
        description: "This feature will be voted on",
        creatorId: "another_user",
        status: "PENDING",
        isDeleted: false,
      });
      
      // Mock vote doesn't exist
      mockPrismaClient.vote.findUnique.mockResolvedValue(null);
      
      // Mock vote creation
      mockPrismaClient.vote.create.mockResolvedValue({
        id: "vote_123",
        userId,
        featureId,
        createdAt: new Date(),
      });
      
      // Act
      const response = await POST(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ message: "Vote updated successfully" });
      expect(mockPrismaClient.feature.findUnique).toHaveBeenCalledWith({
        where: { id: featureId },
      });
      expect(mockPrismaClient.vote.findUnique).toHaveBeenCalledWith({
        where: {
          userId_featureId: {
            userId,
            featureId,
          },
        },
      });
      expect(mockPrismaClient.vote.create).toHaveBeenCalledWith({
        data: {
          userId,
          featureId,
        },
      });
      expect(mockPrismaClient.vote.delete).not.toHaveBeenCalled();
    });

    it("should remove a vote when one already exists", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "POST",
      });

      // Mock authenticated session
      const userId = "user_123";
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: userId, name: "Test User", email: "test@example.com" },
      });
      
      // Mock finding the feature
      mockPrismaClient.feature.findUnique.mockResolvedValue({
        id: featureId,
        title: "Feature to Unvote",
        description: "This feature will have vote removed",
        creatorId: "another_user",
        status: "PENDING",
        isDeleted: false,
      });
      
      // Mock vote exists
      mockPrismaClient.vote.findUnique.mockResolvedValue({
        id: "vote_123",
        userId,
        featureId,
        createdAt: new Date(),
      });
      
      // Act
      const response = await POST(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ message: "Vote updated successfully" });
      expect(mockPrismaClient.vote.delete).toHaveBeenCalledWith({
        where: {
          userId_featureId: {
            userId,
            featureId,
          },
        },
      });
      expect(mockPrismaClient.vote.create).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "POST",
      });

      // Mock unauthenticated session
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // Act
      const response = await POST(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ message: "Unauthorized" });
      expect(mockPrismaClient.feature.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaClient.vote.findUnique).not.toHaveBeenCalled();
    });

    it("should return 404 when feature does not exist", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "POST",
      });

      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      });
      
      // Mock feature not found
      mockPrismaClient.feature.findUnique.mockResolvedValue(null);
      
      // Act
      const response = await POST(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ message: "Feature not found" });
      expect(mockPrismaClient.vote.findUnique).not.toHaveBeenCalled();
    });

    it("should return 500 if a server error occurs", async () => {
      // Arrange
      const request = new Request(`http://localhost:3000/api/features/${featureId}`, {
        method: "POST",
      });

      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      });
      
      // Mock finding the feature
      mockPrismaClient.feature.findUnique.mockResolvedValue({
        id: featureId,
        title: "Feature to Vote On",
        description: "This feature will be voted on",
        creatorId: "another_user",
        status: "PENDING",
        isDeleted: false,
      });
      
      // Mock vote check to throw an error
      mockPrismaClient.vote.findUnique.mockRejectedValue(new Error("Database error"));
      
      // Act
      const response = await POST(request, mockParams);
      const responseData = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ message: "Failed to update vote" });
    });
  });
}); 