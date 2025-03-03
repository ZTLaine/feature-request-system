// This file contains any setup code that should run before each test
// For example, if we needed to extend Jest's expect

// Mock NextResponse constructor and json method
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn((data, options = {}) => {
        return {
          json: () => Promise.resolve(data),
          status: options.status || 200,
          headers: new Map(),
        };
      }),
    },
  };
});

// Global fetch mock
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true
  })
);

// Silence console errors during tests
console.error = jest.fn();

// Reset all mocks automatically between tests
beforeEach(() => {
  jest.clearAllMocks();
}); 