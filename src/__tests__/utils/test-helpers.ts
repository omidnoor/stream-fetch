/**
 * Test Helpers and Utilities
 *
 * Common utilities for API testing
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), requestInit);
}

/**
 * Create a mock FormData request for file uploads
 */
export function createMockFormDataRequest(
  url: string,
  formData: FormData,
  method = 'POST'
): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    body: formData,
  });
}

/**
 * Parse JSON response from NextResponse
 */
export async function parseJsonResponse(response: Response): Promise<any> {
  return response.json();
}

/**
 * Assert successful API response structure
 */
export function expectSuccessResponse(data: any) {
  expect(data).toHaveProperty('success', true);
  expect(data).toHaveProperty('data');
}

/**
 * Assert error API response structure
 */
export function expectErrorResponse(data: any, statusCode?: number) {
  expect(data).toHaveProperty('success', false);
  expect(data).toHaveProperty('error');
}

/**
 * Generate a random project ID for testing
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Mock video info response structure
 */
export const mockVideoInfo = {
  video: {
    title: 'Test Video',
    duration: 120,
    thumbnail: 'https://example.com/thumb.jpg',
    channel: 'Test Channel',
  },
  formats: [
    { itag: 18, quality: '360p', mimeType: 'video/mp4' },
    { itag: 22, quality: '720p', mimeType: 'video/mp4' },
  ],
};

/**
 * Mock dubbing job response structure
 */
export const mockDubbingJob = {
  dubbingId: 'dub-123456',
  status: 'pending',
  targetLanguage: 'es',
  sourceLanguage: 'en',
  progress: 0,
};

/**
 * Mock editor project structure
 */
export const mockEditorProject = {
  id: 'project-123',
  name: 'Test Project',
  description: 'Test Description',
  status: 'draft',
  duration: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  thumbnail: null,
};

/**
 * Mock PDF project structure
 */
export const mockPDFProject = {
  id: 'pdf-123',
  name: 'Test PDF',
  filePath: '/uploads/test.pdf',
  status: 'draft',
  pageCount: 10,
  annotations: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Mock PDF annotation structure
 */
export const mockAnnotation = {
  id: 'ann-123',
  type: 'highlight',
  page: 1,
  content: 'Test annotation',
  position: { x: 100, y: 200, width: 50, height: 20 },
  color: '#FFFF00',
};
