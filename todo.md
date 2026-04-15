## 1. tasks.crud.test.ts - Core CRUD Operations (Tests: 1-4, 10-11, 20, 57, 58, 60-61, 71-73, 90)

Focus: Basic API operations and lifecycle

- Health check & connectivity
- Create task (minimal/full fields)
- Get task by ID
- Update task (PUT semantics)
- Delete task + 404 verification
- Full end-to-end lifecycle
- Concurrent create operations
- ID preservation
- Whitespace trimming
- Unicode/emoji handling  


────────────────────────────────────────────────────────────────────────────────

### 2. tasks.validation.test.ts - Validation & Error Handling (Tests: 5, 9, 18, 35, 38-40, 45-46, 48, 62, 81-82, 89)

Focus: Input validation and error responses

- Field validation errors (400)
- Invalid UUID format
- Invalid status values
- Invalid date formats
- Max tags limit (10)
- Tag length validation (30 chars)
- Tag invalid characters
- Boundary value testing (max title 200, desc 1000)
- Multiple validation errors in one request
- Malformed JSON handling
- Missing Content-Type
- Large request bodies
- Error response structure consistency
- Leap year date handling  


────────────────────────────────────────────────────────────────────────────────

### 3. tasks.filtering-search.test.ts - Filtering, Search & Sort (Tests: 6-7, 12-14, 23-24, 37, 47, 50, 59, 63, 68-69, 77, 79-80, 85, 87)

Focus: Query parameters for listing

- Filter by status (case-insensitive)
- Filter by tag
- Filter by scheduled date
- Filter by multiple criteria (AND logic)
- Complex filter combinations
- Search case-insensitive
- Search in title AND description (OR logic)
- Search with special characters/unicode
- Search with URL-encoded strings
- Search minimum length (2 chars)
- Sort by title, status, createdAt, scheduledDate
- Sort tiebreaker (ID) for equal values
- Empty results for non-existent filters  


────────────────────────────────────────────────────────────────────────────────

### 4. tasks.pagination.test.ts - Pagination (Tests: 8, 25, 31-33, 40, 51-52, 78)

Focus: Cursor-based pagination behavior

- Basic cursor pagination (3 pages)
- Pagination with filters persisting
- Pagination with search/filter combo
- Empty list returns valid structure
- Default limit (20)
- Limit cap at 100
- Limit=0 defaults to 20
- Limit=1 (minimum)
- Invalid cursor handling (graceful fallback)
- Cursor after referenced task deleted  


────────────────────────────────────────────────────────────────────────────────

### 5. tasks.tags.test.ts - Tags & Data Normalization (Tests: 15, 19, 26, 43, 48, 64, 66-67, 76)

Focus: Tag-specific behavior

- Duplicate tag normalization (lowercase + dedup)
- Tag order preservation after dedup
- Tag case-insensitivity in filter
- Tags array defaults to empty
- Explicit empty tags array
- Max 10 tags validation
- Tag length limit (30 chars)
- Valid characters (hyphens, underscores)
- Invalid characters rejected
- Status normalization (lowercase → uppercase)  


────────────────────────────────────────────────────────────────────────────────

### 6. tasks.edge-cases.test.ts - Edge Cases & Advanced (Tests: 16-17, 21-22, 27-30, 34, 41-44, 49, 53-56, 65, 70, 74-75, 83-84, 86, 88)

Focus: Non-standard scenarios and robustness

- CORS headers & preflight
- 404 unknown routes/methods
- End-to-end full lifecycle verification
- Concurrent updates (race conditions)
- Large dataset performance (50+ tasks)
- Timezone conversion to UTC
- Date boundaries (year, leap year, far future)
- Description null vs empty string
- CreatedAt immutable on update
- UpdatedAt advances on each update
- Multiple tasks with same title allowed
- Content-Type enforcement
- Response headers validation
- Query parameter type coercion
- Update without changing values
- HTTP method override rejection
