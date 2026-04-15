import { jest, describe, it, expect } from '@jest/globals';
import { encodeCursor, decodeCursor, createCursorCondition } from '../../src/utils/pagination';

describe('Cursor Pagination', () => {
  describe('encodeCursor', () => {
    it('should encode cursor as Base64 JSON with id, sortField, and filters', () => {
      const cursorData = {
        id: 'abc-123',
        sortField: '2024-01-15T10:00:00.000Z',
        scheduledDate: '2024-01-15T00:00:00Z',
        status: 'TODO',
      };

      const encoded = encodeCursor(cursorData);

      // Should be a base64 string
      expect(Buffer.from(encoded, 'base64').toString()).toEqual(JSON.stringify(cursorData));
    });
  });

  describe('decodeCursor', () => {
    it('should decode and merge cursor with query params', () => {
      const cursorData = {
        id: 'abc-123',
        sortField: '2024-01-15T10:00:00.000Z',
        status: 'TODO',
      };
      const encoded = Buffer.from(JSON.stringify(cursorData)).toString('base64');

      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(cursorData);
    });

    it('should return null for invalid cursor', () => {
      const decoded = decodeCursor('invalid-base64');

      expect(decoded).toBeNull();
    });
  });

  it('should create cursor condition for date sorting', () => {
    const cursor = { id: 'abc-123', sortField: '2024-01-15T10:00:00.000Z' };
    const condition = createCursorCondition(cursor, 'scheduledDate', 'desc');

    expect(condition).toEqual({
      OR: [
        { scheduledDate: { lt: '2024-01-15T10:00:00.000Z' } },
        { scheduledDate: '2024-01-15T10:00:00.000Z', id: { lt: 'abc-123' } },
      ],
    });
  });

  it('should create cursor condition for string sorting', () => {
    const cursor = { id: 'abc-123', sortField: 'Task Title' };
    const condition = createCursorCondition(cursor, 'title', 'asc');

    expect(condition).toEqual({
      OR: [
        { title: { gt: 'Task Title' } },
        { title: 'Task Title', id: { gt: 'abc-123' } },
      ],
    });
  });
});
