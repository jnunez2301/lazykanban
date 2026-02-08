import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import type { AuthRequest } from '@/middleware/auth';

// Mock the auth verification
vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn((token) => Promise.resolve({ userId: 1, email: 'test@example.com' })),
  generateToken: vi.fn(),
}));

// Mock the database
const mockQuery = vi.fn();
vi.mock('@/lib/db', () => ({
  default: {
    query: mockQuery,
  },
}));

// Import the handler after mocking
import { POST } from '@/app/api/projects/[id]/tags/route';

describe('POST /api/projects/[id]/tags - Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (userId: number, body: any): AuthRequest => {
    return {
      user: { userId, email: `user${userId}@test.com` },
      json: async () => body,
      headers: new Headers({ authorization: 'Bearer token' }),
    } as unknown as AuthRequest;
  };

  const mockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  describe('Owner-First Permission Pattern', () => {
    it('should allow project owner to create tag (even without group membership)', async () => {
      const userId = 1;
      const projectId = '10';
      const tagData = { name: 'Bug', color: '#FF0000' };

      // Mock: Check if user is owner (returns row = owner)
      mockQuery.mockResolvedValueOnce([[{ id: 10 }]]);

      // Mock: Get max display order
      mockQuery.mockResolvedValueOnce([[{ max_order: 5 }]]);

      // Mock: Insert tag
      mockQuery.mockResolvedValueOnce([{ insertId: 100 }]);

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(100);
      expect(data.name).toBe('Bug');

      // Verify owner check was called first
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT id FROM projects WHERE id = ? AND owner_id = ?'),
        [projectId, userId]
      );

      // Permission check should NOT be called for owners
      expect(mockQuery).not.toHaveBeenCalledWith(
        expect.stringContaining('can_manage_tags'),
        expect.anything()
      );
    });

    it('should allow member with can_manage_tags permission', async () => {
      const userId = 1;  // Must match auth mock
      const projectId = '10';
      const tagData = { name: 'Feature', color: '#00FF00' };

      // Mock: Owner check returns empty (not owner)
      mockQuery.mockResolvedValueOnce([[]]);

      // Mock: Permission check returns row (has permission)
      mockQuery.mockResolvedValueOnce([[{ can_manage_tags: true }]]);

      // Mock: Get max display order
      mockQuery.mockResolvedValueOnce([[{ max_order: 5 }]]);

      // Mock: Insert tag
      mockQuery.mockResolvedValueOnce([{ insertId: 101 }]);

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));

      expect(response.status).toBe(201);
    });

    it('should deny member without can_manage_tags permission', async () => {
      const userId = 3;
      const projectId = '10';
      const tagData = { name: 'Test', color: '#0000FF' };

      // Mock: Owner check returns empty (not owner)
      mockQuery.mockResolvedValueOnce([[]]);

      // Mock: Permission check returns empty (no permission)
      mockQuery.mockResolvedValueOnce([[]]);

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Permission denied');
    });

    it('should deny non-member (user not in project)', async () => {
      const userId = 999;
      const projectId = '10';
      const tagData = { name: 'Unauthorized', color: '#000000' };

      // Mock: Owner check returns empty
      mockQuery.mockResolvedValueOnce([[]]);

      // Mock: Permission check returns empty (not in any group)
      mockQuery.mockResolvedValueOnce([[]]);

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));

      expect(response.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('should reject missing name', async () => {
      const userId = 1;
      const projectId = '10';
      const tagData = { color: '#FF0000' }; // Missing name

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');

      // No database queries should be made if validation fails
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should reject invalid color format', async () => {
      const userId = 1;
      const projectId = '10';
      const tagData = { name: 'Bug', color: 'invalid' };

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');

      // No database queries should be made if validation fails
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should use default color if not provided', async () => {
      const userId = 1;
      const projectId = '10';
      const tagData = { name: 'Bug' }; // No color

      mockQuery.mockResolvedValueOnce([[{ id: 10 }]]);
      mockQuery.mockResolvedValueOnce([[{ max_order: 0 }]]);
      mockQuery.mockResolvedValueOnce([{ insertId: 102 }]);

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.color).toBe('#6B7280'); // Default color
    });
  });

  describe('Database Errors', () => {
    it('should handle database errors gracefully', async () => {
      const userId = 1;
      const projectId = '10';
      const tagData = { name: 'Bug', color: '#FF0000' };

      // Mock database error on first query (owner check)
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle duplicate tag names', async () => {
      const userId = 1;
      const projectId = '10';
      const tagData = { name: 'Bug', color: '#FF0000' };

      mockQuery.mockResolvedValueOnce([[{ id: 10 }]]);
      mockQuery.mockResolvedValueOnce([[{ max_order: 0 }]]);

      // Mock duplicate entry error on INSERT
      const dupError: any = new Error('Duplicate entry');
      dupError.code = 'ER_DUP_ENTRY';
      mockQuery.mockRejectedValueOnce(dupError);

      const req = createMockRequest(userId, tagData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });
});
