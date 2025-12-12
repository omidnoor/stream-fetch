/**
 * Integration Test for Automated Dubbing Pipeline
 * Tests the complete end-to-end flow with a real YouTube video
 */

import http from 'http';

// Test configuration
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo" - 19 seconds
const API_BASE = 'http://localhost:3000';
const TARGET_LANGUAGE = 'es';
const CHUNK_DURATION = 30;
const MAX_PARALLEL_JOBS = 2;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Helper to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  log(`Making ${method} request to ${endpoint}...`, colors.blue);

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API request failed: ${data.error || response.statusText}`);
  }

  return data;
}

// Test Phase 1: Get video info and estimate
async function testVideoInfo() {
  logStep(1, 'Testing /api/video-info endpoint');

  const response = await apiRequest(`/api/video-info?url=${encodeURIComponent(TEST_VIDEO_URL)}`);

  if (!response.success || !response.data) {
    throw new Error('Failed to get video info');
  }

  const { video, formats } = response.data;

  logSuccess(`Video title: "${video.title}"`);
  logSuccess(`Duration: ${video.duration} seconds`);
  logSuccess(`Available formats: ${formats.length}`);

  return response.data;
}

// Test Phase 2: Start automation pipeline
async function testStartPipeline(videoInfo) {
  logStep(2, 'Testing /api/automation/start endpoint');

  const config = {
    chunkDuration: CHUNK_DURATION,
    targetLanguage: TARGET_LANGUAGE,
    maxParallelJobs: MAX_PARALLEL_JOBS,
    videoQuality: '720p',
    outputFormat: 'mp4',
    useWatermark: true,
    keepIntermediateFiles: false,
    chunkingStrategy: 'fixed',
  };

  const response = await apiRequest('/api/automation/start', 'POST', {
    youtubeUrl: TEST_VIDEO_URL,
    config,
  });

  logSuccess(`Job created: ${response.jobId}`);
  logSuccess(`Estimated time: ${response.estimatedTime} seconds`);
  logSuccess(`Estimated cost: $${response.estimatedCost.toFixed(2)}`);

  return response.jobId;
}

// Test Phase 3: Monitor progress via SSE
async function testProgressMonitoring(jobId) {
  logStep(3, 'Testing /api/automation/stream SSE endpoint');

  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/api/automation/stream/${jobId}`;

    log(`Connecting to SSE stream: ${url}`, colors.blue);

    const req = http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`SSE connection failed: ${res.statusCode}`));
        return;
      }

      logSuccess('SSE connection established');

      let buffer = '';
      let lastProgress = 0;
      let lastStage = '';
      let heartbeatCount = 0;
      let progressEvents = 0;
      let logEvents = 0;

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/^event: (.+)/m);
          const dataMatch = line.match(/^data: (.+)/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const eventData = JSON.parse(dataMatch[1]);

            if (eventType === 'heartbeat') {
              heartbeatCount++;
              if (heartbeatCount % 6 === 0) {
                log(`  Heartbeat (${heartbeatCount})...`, colors.blue);
              }
            } else if (eventType === 'progress') {
              progressEvents++;
              const { stage, overallPercent } = eventData;

              if (stage !== lastStage || Math.abs(overallPercent - lastProgress) >= 5) {
                log(`  Progress: ${stage} - ${overallPercent}%`, colors.cyan);
                lastStage = stage;
                lastProgress = overallPercent;
              }

              // Check dubbing progress for BUG #8 fix verification
              if (eventData.dubbing) {
                const { chunks, activeJobs, completed, failed } = eventData.dubbing;

                // Verify we're getting detailed chunk status (not just fallback)
                const hasDetailedStatus = chunks.some(c => c.dubbingJobId || c.startedAt);
                if (hasDetailedStatus) {
                  logSuccess(`✓ BUG #8 FIX VERIFIED: Detailed chunk status available`);
                }

                log(`  Dubbing: ${completed}/${chunks.length} complete, ${activeJobs} active, ${failed} failed`, colors.blue);
              }
            } else if (eventType === 'log') {
              logEvents++;
              const { level, message } = eventData;
              const prefix = level === 'error' ? '  ERROR:' : '  LOG:';
              log(`${prefix} ${message}`, level === 'error' ? colors.red : colors.blue);
            } else if (eventType === 'complete') {
              logSuccess('Pipeline completed successfully!');
              logSuccess(`Output file: ${eventData.outputFile}`);
              logSuccess(`Duration: ${(eventData.duration / 1000).toFixed(1)}s`);
              logSuccess(`Total progress events: ${progressEvents}`);
              logSuccess(`Total log events: ${logEvents}`);
              logSuccess(`Total heartbeats: ${heartbeatCount}`);

              resolve({
                success: true,
                outputFile: eventData.outputFile,
                duration: eventData.duration,
              });
            } else if (eventType === 'error') {
              logError(`Pipeline failed: ${eventData.message}`);
              reject(new Error(eventData.message));
            }
          }
        }
      });

      res.on('end', () => {
        logWarning('SSE connection closed');
      });

      res.on('error', (err) => {
        reject(err);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    // Timeout after 10 minutes
    setTimeout(() => {
      req.destroy();
      reject(new Error('Test timeout after 10 minutes'));
    }, 600000);
  });
}

// Test Phase 4: Verify job status
async function testJobStatus(jobId) {
  logStep(4, 'Testing /api/automation/status endpoint');

  const response = await apiRequest(`/api/automation/status/${jobId}`);

  if (!response.job) {
    throw new Error('Failed to get job status');
  }

  const { job } = response;

  logSuccess(`Job status: ${job.status}`);
  logSuccess(`Created: ${new Date(job.createdAt).toISOString()}`);
  logSuccess(`Updated: ${new Date(job.updatedAt).toISOString()}`);

  // Verify BUG #4 fix: Date deserialization
  if (job.progress.dubbing && job.progress.dubbing.chunks.length > 0) {
    const chunk = job.progress.dubbing.chunks[0];
    if (chunk.startedAt) {
      const isValidDate = !isNaN(new Date(chunk.startedAt).getTime());
      if (isValidDate) {
        logSuccess(`✓ BUG #4 FIX VERIFIED: ChunkStatus dates properly deserialized`);
      } else {
        logWarning(`⚠ BUG #4 ISSUE: ChunkStatus dates not deserialized correctly`);
      }
    }
  }

  return job;
}

// Test Phase 5: Test download endpoint
async function testDownload(jobId) {
  logStep(5, 'Testing /api/automation/download endpoint');

  const url = `${API_BASE}/api/automation/download/${jobId}`;

  log(`Fetching download URL: ${url}`, colors.blue);

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Download failed: ${error.error || response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');

  logSuccess(`Content-Type: ${contentType}`);
  logSuccess(`Content-Length: ${contentLength} bytes`);

  // Don't actually download the file, just verify headers
  logSuccess('Download endpoint verified (headers check only)');
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('AUTOMATED DUBBING PIPELINE - INTEGRATION TEST', colors.cyan);
  log('='.repeat(70) + '\n', colors.cyan);

  log(`Test Video: ${TEST_VIDEO_URL}`);
  log(`Target Language: ${TARGET_LANGUAGE}`);
  log(`Chunk Duration: ${CHUNK_DURATION}s`);
  log(`Max Parallel Jobs: ${MAX_PARALLEL_JOBS}\n`);

  const startTime = Date.now();
  let jobId;

  try {
    // Phase 1: Get video info
    const videoInfo = await testVideoInfo();

    // Phase 2: Start pipeline
    jobId = await testStartPipeline(videoInfo);

    // Phase 3: Monitor progress
    const result = await testProgressMonitoring(jobId);

    // Phase 4: Verify job status
    await testJobStatus(jobId);

    // Phase 5: Test download
    await testDownload(jobId);

    // Success summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log('\n' + '='.repeat(70), colors.green);
    log('ALL TESTS PASSED ✓', colors.green);
    log('='.repeat(70), colors.green);
    log(`Total test duration: ${duration}s`, colors.green);
    log(`Job ID: ${jobId}`, colors.green);
    log(`Output: ${result.outputFile}`, colors.green);

    process.exit(0);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log('\n' + '='.repeat(70), colors.red);
    log('TEST FAILED ✗', colors.red);
    log('='.repeat(70), colors.red);
    log(`Error: ${error.message}`, colors.red);
    if (error.stack) {
      log(`\nStack trace:\n${error.stack}`, colors.red);
    }
    log(`Total test duration: ${duration}s`, colors.red);
    if (jobId) {
      log(`Job ID: ${jobId}`, colors.red);
    }

    process.exit(1);
  }
}

// Run the tests
runTests();
