export interface CursorData {
  id: string;
  sortField?: string;
  [key: string]: any;
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString();
    return JSON.parse(decoded) as CursorData;
  } catch {
    return null;
  }
}

export function createCursorCondition(
  cursor: CursorData,
  sortField: string,
  sortOrder: 'asc' | 'desc'
): any {
  const comparator = sortOrder === 'asc' ? 'gt' : 'lt';
  
  if (cursor.sortField === undefined) {
    return {
      id: { [comparator]: cursor.id },
    };
  }

  return {
    OR: [
      { [sortField]: { [comparator]: cursor.sortField } },
      {
        [sortField]: cursor.sortField,
        id: { [comparator]: cursor.id },
      },
    ],
  };
}
