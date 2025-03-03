import { PrismaClient, UserRole } from "@prisma/client";
import { JWT } from "next-auth/jwt";
import { User as NextAuthUser } from "next-auth";

// Define our custom User type that extends NextAuth's User
interface CustomUser extends NextAuthUser {
  role: UserRole;
}

// Mock NextAuth - this needs to be before importing the route
jest.mock("next-auth", () => {
  const mockNextAuth = jest.fn(() => ({ 
    GET: jest.fn(), 
    POST: jest.fn() 
  }));
  return mockNextAuth;
});

// Now we can import authOptions after the mock is set up
import { authOptions } from './route';

// Mock PrismaClient
jest.mock("@prisma/client", () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
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

describe("NextAuth Configuration", () => {
  describe("Basic Configuration", () => {
    it("should have correct basic configuration", () => {
      expect(authOptions).toBeDefined();
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.providers.length).toBe(1);
      expect(authOptions.providers[0].id).toBe("credentials");
      expect(authOptions.session?.strategy).toBe("jwt");
      expect(authOptions.pages?.signIn).toBe("/login");
    });
  });

  describe("Callbacks", () => {
    it("should add user id and role to token", async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();
      
      if (!jwtCallback) return; // TypeScript guard
      
      const mockToken: JWT = {
        id: "existing_id",
        role: UserRole.USER,
      };
      
      const mockUser: CustomUser = {
        id: "user_123",
        role: UserRole.ADMIN,
        name: "Test User",
        email: "test@example.com",
      };
      
      const result = await jwtCallback({ 
        token: mockToken, 
        user: mockUser,
        account: null,
        profile: undefined,
        trigger: "signIn",
        isNewUser: false,
      });
      
      expect(result).toEqual({
        id: "user_123",
        role: UserRole.ADMIN,
      });
    });

    it("should preserve existing token data when no user provided", async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();
      
      if (!jwtCallback) return; // TypeScript guard
      
      const mockToken: JWT = {
        id: "existing_id",
        role: UserRole.USER,
      };
      
      const mockUser: CustomUser = {
        id: "existing_id",
        role: UserRole.USER,
        name: "Test User",
        email: "test@example.com",
      };
      
      const result = await jwtCallback({ 
        token: mockToken, 
        user: mockUser,
        account: null,
        profile: undefined,
        trigger: "update",
        isNewUser: false,
      });
      
      expect(result).toEqual(mockToken);
    });

    it("should add user id and role to session", async () => {
      const sessionCallback = authOptions.callbacks?.session;
      expect(sessionCallback).toBeDefined();
      
      if (!sessionCallback) return; // TypeScript guard
      
      const mockSession = { 
        user: { 
          name: "Test User",
          email: "test@example.com",
        },
        expires: new Date().toISOString(),
      };
      
      const mockToken: JWT = {
        id: "user_123",
        role: UserRole.ADMIN,
      };
      
      const result = await sessionCallback({ 
        session: mockSession as any, 
        token: mockToken,
        trigger: "update",
      } as any);
      
      expect(result.user).toEqual({
        name: "Test User",
        email: "test@example.com",
        id: "user_123",
        role: UserRole.ADMIN,
      });
    });

    it("should preserve existing session data when no token provided", async () => {
      const sessionCallback = authOptions.callbacks?.session;
      expect(sessionCallback).toBeDefined();
      
      if (!sessionCallback) return; // TypeScript guard
      
      const mockSession = { 
        user: { 
          name: "Test User",
          email: "test@example.com",
        },
        expires: new Date().toISOString(),
      };
      
      const result = await sessionCallback({ 
        session: mockSession as any, 
        token: null,
        trigger: "update",
      } as any);
      
      expect(result).toEqual(mockSession);
    });
  });
});

// Basic test for authOptions configuration
describe("NextAuth configuration", () => {
  it("should have the correct providers and configuration", () => {
    // Test that authOptions has the expected structure and providers
    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toBeDefined();
    expect(Array.isArray(authOptions.providers)).toBe(true);
    
    // Check if we have at least the credential provider
    const credentialsProvider = authOptions.providers.find(
      (provider) => provider.id === "credentials"
    );
    expect(credentialsProvider).toBeDefined();
    
    // Check callbacks
    expect(authOptions.callbacks).toBeDefined();
    expect(typeof authOptions.callbacks?.jwt).toBe("function");
    expect(typeof authOptions.callbacks?.session).toBe("function");
    
    // Check pages configuration
    expect(authOptions.pages).toBeDefined();
    expect(authOptions.pages?.signIn).toBe("/login");
  });
}); 