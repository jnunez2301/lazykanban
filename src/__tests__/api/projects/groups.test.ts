import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthRequest } from '@/middleware/auth';

// Mock the auth verification
vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn((token) => Promise.resolve({ userId: 1, email: 'test@example.com' })),
  generateToken: vi.fn(),
}));

// Mock the database with transaction support
const mockQuery = vi.fn();
const mockBeginTransaction = vi.fn();
const mockCommit = vi.fn();
const mockRollback = vi.fn();
const mockRelease = vi.fn();

const mockConnection = {
  query: mockQuery,  // Use same mockQuery for connection.query
  beginTransaction: mockBeginTransaction,
  commit: mockCommit,
  rollback: mockRollback,
  release: mockRelease,
};

vi.mock('@/lib/db', () => ({
  default: {
    query: mockQuery,
    getConnection: vi.fn(() => Promise.resolve(mockConnection)),
  },
}));

// Import handler after mocking
import { POST } from '@/app/api/projects/[id]/groups/route';

describe('POST /api/projects/[id]/groups - Security Tests', () => {
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
    it('should allow project owner to create group', async () => {
      const userId = 1;
      const projectId = '10';
      const groupData = { name: 'Developers', description: 'Dev team' };

      // Mock: Owner check (user is owner) - uses db.query
      mockQuery.mockResolvedValueOnce([[{ id: 10 }]]);

      // Mock: beginTransaction is called - no return value needed
      mockBeginTransaction.mockResolvedValueOnce(undefined);

      // Mock: Insert group - uses connection.query
      mockQuery.mockResolvedValueOnce([{ insertId: 20 }]);

      // Mock: Insert permissions - uses connection.query
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Mock: commit
      mockCommit.mockResolvedValueOnce(undefined);

      const req = createMockRequest(userId, groupData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(20);
      expect(data.name).toBe('Developers');

      // Verify owner check was called
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM projects WHERE id = ? AND owner_id = ?'),
        [projectId, userId]
      );

      // Verify transaction was used
      expect(mockBeginTransaction).toHaveBeenCalled();
      expect(mockCommit).toHaveBeenCalled();
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should allow member with can_edit_project permission', async () => {
      const userId = 2;
      const projectId = '10';
      const groupData = { name: 'QA Team' };

      // Mock: Owner check (not owner)
      mockQuery.mockResolvedValueOnce([[]]);

      // Mock: Permission check (has can_edit_project)
      mockQuery.mockResolvedValueOnce([[{ can_edit_project: true }]]);

      // Mock: Transaction
      mockBeginTransaction.mockResolvedValueOnce(undefined);
      mockQuery.mockResolvedValueOnce([{ insertId: 21 }]);
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockCommit.mockResolvedValueOnce(undefined);

      const req = createMockRequest(userId, groupData);
      const response = await POST(req, mockParams(projectId));

      expect(response.status).toBe(201);
    });

    it('should deny member without can_edit_project permission', async () => {
      const userId = 3;
      const projectId = '10';
      const groupData = { name: 'Unauthorized Group' };

      // Mock: Owner check (not owner)
      mockQuery.mockResolvedValueOnce([[]]);

      // Mock: Permission check (no permission)
      mockQuery.mockResolvedValueOnce([[]]);

      const req = createMockRequest(userId, groupData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Permission denied');

      // Transaction should not be started
      expect(mockBeginTransaction).not.toHaveBeenCalled();
    });

    it('should deny non-member', async () => {
      const userId = 999;
      const projectId = '10';
      const groupData = { name: 'Hacker Group' };

      mockQuery.mockResolvedValueOnce([[]]); // Not owner
      mockQuery.mockResolvedValueOnce([[]]); // No permissions

      const req = createMockRequest(userId, groupData);
      const response = await POST(req, mockParams(projectId));

      expect(response.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('should reject name shorter than 2 characters', async () => {
      const userId = 1;
      const projectId = '10';
      const groupData = { name: 'A' }; // Too short

      const req = createMockRequest(userId, groupData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');

      // No database queries should be made if validation fails
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should accept group without description', async () => {
      const userId = 1;
      const projectId = '10';
      const groupData = { name: 'Simple Group' };

      mockQuery.mockResolvedValueOnce([[{ id: 10 }]]);
      mockBeginTransaction.mockResolvedValueOnce(undefined);
      mockQuery.mockResolvedValueOnce([{ insertId: 22 }]);
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockCommit.mockResolvedValueOnce(undefined);

      const req = createMockRequest(userId, groupData);
      const response = await POST(req, mockParams(projectId));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.description).toBeUndefined();
    });
  });

  describe('Transaction Handling', () => {
    it('should rollback on error during group creation', async () => {
      const userId = 1;
      const projectId = '10';
      const groupData = { name: 'Test Group' };

      mockQuery.mockResolvedValueOnce([[{ id: 10 }]]);
      mockBeginTransaction.mockResolvedValueOnce(undefined);

      // Mock: Insert group succeeds
      mockQuery.mockResolvedValueOnce([{ insertId: 23 }]);

      // Mock: Insert permissions fails
      mockQuery.mockRejectedValueOnce(new Error('Permission insert failed'));
      mockRollback.mockResolvedValueOnce(undefined);

      const req = createMockRequest(userId, groupData);
      const response = await POST(req, mockParams(projectId));

      expect(response.status).toBe(500);
      expect(mockBeginTransaction).toHaveBeenCalled();
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should create default permissions with all false', async () => {
      const userId = 1;
      const projectId = '10';
      const groupData = { name: 'Restricted Group' };

      mockQuery.mockResolvedValueOnce([[{ id: 10 }]]);
      mockBeginTransaction.mockResolvedValueOnce(undefined);
      mockQuery.mockResolvedValueOnce([{ insertId: 24 }]);
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockCommit.mockResolvedValueOnce(undefined);

      const req = createMockRequest(userId, groupData);
      await POST(req, mockParams(projectId));

      // Verify permissions insert was called with just group_id
      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO permissions (group_id) VALUES (?)',
        [24]
      );
    });
  });
});
