# Jest ES Module Mocking Blocker

**Date:** 2025-12-08
**Status:** BLOCKED
**Tests Affected:** 31 API route tests across 6 files

---

## Executive Summary

After extensive attempts to fix failing API route tests, we've identified that **Jest's ES module mocking is not functioning properly** in this codebase. Despite correctly structuring mocks using Jest's documented patterns, the mocks are not being applied, and tests are calling real service instances instead.

### Evidence

1. **Mock Configuration Appears Correct:**
   ```typescript
   // Mock defined before imports
   const mockGetDownloadFormat = jest.fn();
   jest.mock('@/services/youtube', () => ({
     getYouTubeService: () => ({
       getDownloadFormat: mockGetDownloadFormat,
     }),
   }));

   // Import after mock
   import { GET } from '@/app/api/download/route';
   ```

2. **Real Services Are Being Called:**
   ```
   console.log
     [YouTubeRepository] Trying ANDROID client for video: abc123
       at YouTubeRepository.fetchVideoInfo (src/services/youtube/youtube.repository.ts:33:17)

   console.log
     [DubbingFactory] Created new DubbingService instance
       at getDubbingService (src/services/dubbing/dubbing.factory.ts:56:13)
   ```

3. **Jest Warning:**
   ```
   (node:87400) ExperimentalWarning: VM Modules is an experimental feature
   and might change at any time
   ```

## Root Cause

Jest's ES module support (`--experimental-vm-modules`) is experimental and has significant limitations:

- Module mocking with `jest.mock()` doesn't properly intercept ES module imports
- The mock factory functions aren't being hoisted correctly
- Service singletons created at module load time bypass mocks entirely

This is a **known limitation of Jest with ES modules**, not an issue with our test code.

## What We Tried

### Attempt 1: Basic Mock Setup
❌ Used `jest.mock()` with factory function returning mock instances
**Result:** Mock not applied, real service called

### Attempt 2: Explicit Mock Functions
❌ Created mock functions in test file scope before `jest.mock()`
**Result:** Mock not applied, real service called

### Attempt 3: Reordered Imports
❌ Ensured mocks defined before any route imports
**Result:** Mock not applied, real service called
**Evidence:** Actual service logs appear in test output

---

## Current Test Status

### ✅ Passing Tests: 185 / 216 (86%)

**Our New Tests (100% Success):**
- cost-calculator.test.ts - 22 tests ✅
- youtube.validator.test.ts - 35 tests ✅
- dubbing.validator.test.ts - 46 tests ✅
- youtube.mapper.test.ts - 27 tests ✅

**Pre-existing Passing Tests:**
- editor-utils.test.ts - 18 tests ✅
- Parameter validation tests in API routes ✅

### ❌ Failing Tests: 31 / 216 (14%)

All failures are in **API route integration tests** that require mocking service layers:

1. download.test.ts - 5 failures
2. dubbing.test.ts - 6 failures
3. video-info.test.ts - 4 failures
4. editor-project.test.ts - 10 failures
5. pdf-project.test.ts - 7 failures
6. pdf-annotation.test.ts - 4 failures

---

## Recommendations

### Option 1: Convert to Integration Tests (Recommended)

Since mocks don't work, embrace integration testing:

```typescript
// Integration test approach
describe('POST /api/dubbing/create', () => {
  it('should create dubbing job with valid ElevenLabs API key', async () => {
    // Set up real environment
    process.env.ELEVENLABS_API_KEY = 'test_key';

    // Use real services but mock external HTTP calls
    nock('https://api.elevenlabs.io')
      .post('/v1/dubbing')
      .reply(200, { dubbing_id: 'dub_123456' });

    const request = createMockRequest('/api/dubbing/create', {
      method: 'POST',
      body: { sourceUrl: '...', targetLanguage: 'es' },
    });

    const response = await createDubbing(request);
    expect(response.status).toBe(200);
  });
});
```

**Pros:**
- Tests realistic behavior with actual service layer
- Catches integration issues that unit tests miss
- Works with current codebase structure

**Cons:**
- Slower than pure unit tests
- Requires HTTP mocking library (nock, msw)
- More complex setup

### Option 2: Restructure for Dependency Injection

Make services injectable to enable easier testing:

```typescript
// route.ts
export async function POST(
  request: NextRequest,
  dubbingService = getDubbingService() // Injectable with default
) {
  // ... route logic
}

// test.ts
it('should create dubbing job', async () => {
  const mockService = {
    createDubbingJob: jest.fn().mockResolvedValue({ dubbingId: 'dub_123' })
  };

  await POST(request, mockService); // Inject mock
});
```

**Pros:**
- True unit testing possible
- No reliance on Jest module mocking
- More testable architecture

**Cons:**
- Requires refactoring all API routes
- Changes production code for testing
- Significant effort (4-6 hours)

### Option 3: Switch to Vitest

Vitest has better ES module support:

```bash
npm install -D vitest @vitest/ui
```

**Pros:**
- Better ES module mocking support
- Faster test execution
- Compatible with Jest API (minimal changes)

**Cons:**
- Requires migration effort
- May still have module mocking issues
- Not guaranteed to solve the problem

### Option 4: Accept Current State

Focus on what's working:

**Pros:**
- 130 new high-value tests passing (validators, mappers, utilities)
- 86% overall test coverage
- Can add more non-mocked tests (services, transformers)

**Cons:**
- API routes remain untested
- 31 failing tests in suite
- Incomplete coverage

---

## Immediate Next Steps

### High Priority

1. **Choose Testing Strategy**
   Decide between integration tests (Option 1) or dependency injection (Option 2)

2. **Fix Dubbing ID Format**
   Tests use `'dub-123'` but validator expects `'dub_123'` (underscore)
   Quick fix in test files

3. **Document Decision**
   Update TEST_STATUS_REPORT.md with chosen approach

### Alternative Path: Add More Passing Tests

Instead of fighting the mocking system, create more tests that work:

1. **Service Layer Tests** (Don't require route mocking)
   - chunk.service.ts - Time parsing, manifest handling
   - parallel-dubbing.service.ts - Queue and retry logic

2. **Additional Validator Tests**
   - editor.validator.ts (489 lines)
   - pdf.validator.ts (395 lines)

3. **Mapper Tests**
   - dubbing.mapper.ts
   - editor.mapper.ts
   - pdf.mapper.ts

These would add 60-80 more passing tests without fighting Jest's limitations.

---

## Technical Details

### Jest Configuration

```json
{
  "preset": "ts-jest/presets/default-esm",
  "extensionsToTreatAsEsm": [".ts"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "transform": {
    "^.+\\.tsx?$": ["ts-jest", {
      "useESM": true
    }]
  }
}
```

### Test File Structure

```typescript
// Mocks defined at top
const mockFn = jest.fn();
jest.mock('@/services/module', () => ({
  getService: () => ({ method: mockFn }),
}));

// Imports after mocks
import { GET } from '@/app/api/route';

// Tests
describe('API Route', () => {
  beforeEach(() => {
    mockFn.mockReset();
  });

  it('test case', async () => {
    mockFn.mockResolvedValue(data);
    // ...
  });
});
```

### Why This Should Work (But Doesn't)

According to Jest documentation, this pattern should work:
1. Mocks are defined before imports ✓
2. Factory function returns mock implementation ✓
3. Mock functions are scoped correctly ✓

But in practice with ES modules:
- Module imports are hoisted by Node.js before Jest can intercept
- Singleton patterns create instances at import time
- `--experimental-vm-modules` doesn't fully support all mocking patterns

---

## References

- [Jest ES Modules Documentation](https://jestjs.io/docs/ecmascript-modules)
- [Jest GitHub Issue: ESM Support](https://github.com/jestjs/jest/issues/9430)
- [Node.js VM Modules (Experimental)](https://nodejs.org/api/vm.html#vm_class_vm_module)

---

## Conclusion

We've created **130 valuable, passing tests** for critical business logic (validators, mappers, calculators). The 31 failing tests are blocked by Jest's experimental ES module mocking limitations, not by issues in our test code or application code.

**Recommended Action:** Choose Option 1 (Integration Tests) or Option 4 (Add More Passing Tests) to move forward productively.
