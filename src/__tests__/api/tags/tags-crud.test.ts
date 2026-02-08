import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Import handlers after mocking
import { PATCH, DELETE } from '@/app/api/tags/[id]/route';

describe('Tags CRUD - Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (userId: number, body?: any): AuthRequest => {
    return {
      user: { userId, email: `user${userId}@test.com` },
      json: async () => body || {},
      headers: new Headers({ authorization: 'Bearer token' }),
    } as unknown as AuthRequest;
  };

  const mockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  describe('PATCH /api/tags/[id] - Edit Tag', () => {
    it('should allow project owner to edit tag', async () => {
      const userId = 1;
      const tagId = '50';
      const updates = { name: 'Updated Bug', color: '#FF00FF' };

      // Mock: Get tag info with project ownership
      mockQuery.mockResolvedValueOnce([[
        { project_id: 10, owner_id: 1 } // User is owner
      ]]);

      // Mock: Update tag
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Mock: Get updated tag
      mockQuery.mockResolvedValueOnce([[
        { id: 50, name: 'Updated Bug', color: '#FF00FF' }
      ]]);

      const req = createMockRequest(userId, updates);
      const response = await PATCH(req, mockParams(tagId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Bug');

      // Verify ownership check was performed
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT t.project_id, pr.owner_id'),
        [tagId]
      );
    });

    it('should allow member with can_manage_tags permission', async () => {
      const userId = 1;  // Must match auth mock
      const tagId = '50';
      const updates = { color: '#00FFFF' };

      // Mock: Get tag info (user not owner - different owner_id)
      mockQuery.mockResolvedValueOnce([[
        { project_id: 10, owner_id: 999 } // Different owner
      ]]);

      // Mock: Permission check (has permission)
      mockQuery.mockResolvedValueOnce([[{ can_manage_tags: true }]]);

      // Mock: UPDATE query
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Mock: SELECT * FROM tags WHERE id = ? (returns full tag object)
      mockQuery.mockResolvedValueOnce([[
        { id: parseInt(tagId), name: 'Tag', color: '#00FFFF', project_id: 10, is_default: 0, display_order: 1 }
      ]]);

      const req = createMockRequest(userId, updates);
      const response = await PATCH(req, mockParams(tagId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.color).toBe('#00FFFF');
    });

    it('should deny member without permission', async () => {
      const userId = 1;  // Must match auth mock
      const tagId = '50';
      const updates = { name: 'Hacked' };

      // Mock: Get tag info (user not owner - different owner_id)
      mockQuery.mockResolvedValueOnce([[{ project_id: 10, owner_id: 999 }]]);

      // Mock: Permission check (no permission)
      mockQuery.mockResolvedValueOnce([[]]);

      const req = createMockRequest(userId, updates);
      const response = await PATCH(req, mockParams(tagId));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Permission denied');
    });

    it('should return 404 for non-existent tag', async () => {
      const userId = 1;
      const tagId = '999';
      const updates = { name: 'Test' };

      // Mock: Tag not found
      mockQuery.mockResolvedValueOnce([[]]);

      const req = createMockRequest(userId, updates);
      const response = await PATCH(req, mockParams(tagId));

      expect(response.status).toBe(404);
    });

    it('should reject empty updates', async () => {
      const userId = 1;
      const tagId = '50';
      const updates = {}; // No changes

      mockQuery.mockResolvedValueOnce([[{ project_id: 10, owner_id: 1 }]]);

      const req = createMockRequest(userId, updates);
      const response = await PATCH(req, mockParams(tagId));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No valid fields to update');
    });
  });

  describe('DELETE /api/tags/[id] - Delete Tag', () => {
    it('should allow project owner to delete tag', async () => {
      const userId = 1;
      const tagId = '50';

      // Mock: Get tag info (owner, not default)
      mockQuery.mockResolvedValueOnce([[
        { project_id: 10, owner_id: 1, is_default: false }
      ]]);

      // Mock: Delete tag
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = createMockRequest(userId);
      const response = await DELETE(req, mockParams(tagId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('deleted successfully');
    });

    it('should prevent deletion of default system tags', async () => {
      const userId = 1;
      const tagId = '1';

      // Mock: Get tag info (default tag)
      mockQuery.mockResolvedValueOnce([[
        { project_id: 10, owner_id: 1, is_default: true }
      ]]);

      const req = createMockRequest(userId);
      const response = await DELETE(req, mockParams(tagId));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot delete default');
    });

    it('should deny deletion without permission', async () => {
      const userId = 1;  // Must match auth mock
      const tagId = '50';

      // Mock: Get tag info with owner_id (not owner - different owner_id, not default)
      mockQuery.mockResolvedValueOnce([[
        { project_id: 10, owner_id: 999, is_default: 0 }
      ]]);

      // Mock: Permission check (no permission - empty result)
      mockQuery.mockResolvedValueOnce([[]]);

      const req = createMockRequest(userId);
      const response = await DELETE(req, mockParams(tagId));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Permission denied');
    });
  });
});
