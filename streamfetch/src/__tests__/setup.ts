/**
 * Jest Test Setup
 *
 * This file is run before each test file.
 */

import { jest, expect } from '@jest/globals';

// Extend Jest matchers if needed
expect.extend({});

// Global test timeout
jest.setTimeout(10000);

// Make jest available globally for mocks
(globalThis as any).jest = jest;
