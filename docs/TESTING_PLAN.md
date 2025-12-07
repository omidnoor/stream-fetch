# Automated Dubbing Pipeline - Testing & QA Plan

## Overview

This document outlines the comprehensive testing plan for the automated dubbing pipeline. The goal is to systematically verify all functionality, catch logic errors, and ensure production readiness.

## Testing Categories

### 1. Code Review & Static Analysis

#### Core Infrastructure
- [ ] **automation.types.ts** - Verify all TypeScript interfaces match actual usage
  - Check all type exports
  - Verify no missing fields
  - Ensure proper optional vs required fields

- [ ] **job-store.ts** - Review CRUD operations
  - Test create, read, update, delete operations
  - Verify file persistence works correctly
  - Check error handling for file operations
  - Test serialization/deserialization

- [ ] **progress-emitter.ts** - Verify event system
  - Test all event types (progress, log, complete, error)
  - Verify subscription/unsubscription
  - Check memory leaks in event listeners

- [ ] **temp-manager.ts** - Review file management
  - Test directory creation
  - Verify cleanup scheduling
  - Test cleanup execution
  - Check orphaned file handling

- [ ] **cost-calculator.ts** - Verify calculations
  - Test pricing formulas
  - Verify watermark discount (50%)
  - Check time estimates
  - Test chunk calculation

#### Processing Services
- [ ] **chunk.service.ts** - Review FFmpeg integration
  - Verify FFmpeg commands are correct
  - Test manifest generation
  - Check error handling
  - Verify progress callbacks

- [ ] **parallel-dubbing.service.ts** - Review queue logic
  - Test concurrency limiting (1-5 jobs)
  - Verify retry logic with exponential backoff
  - Check queue management
  - Test error recovery

- [ ] **merge.service.ts** - Review merging logic
  - Verify audio replacement commands
  - Test concatenation logic
  - Check file path handling
  - Verify progress tracking

- [ ] **automation.service.ts** - Review orchestrator
  - Verify pipeline flow (download → chunk → dub → merge → finalize)
  - Check state management
  - Test error propagation
  - Verify cleanup calls

- [ ] **TypeScript Quality**
  - No `any` types used
  - All functions properly typed
  - Proper error types
  - Interface consistency

---

### 2. API Endpoint Testing

#### Start Pipeline
- [ ] **POST /api/automation/start**
  - Test with valid YouTube URL
  - Test with invalid URL
  - Verify job creation
  - Check async execution
  - Test error responses

#### Job Status
- [ ] **GET /api/automation/status/:jobId**
  - Test with valid job ID
  - Test with invalid job ID
  - Verify status accuracy
  - Check response format

#### Real-Time Streaming
- [ ] **GET /api/automation/stream/:jobId**
  - Test SSE connection
  - Verify event formatting
  - Check heartbeat mechanism
  - Test connection cleanup
  - Verify progress events
  - Test log events
  - Test completion events

#### Job Control
- [ ] **POST /api/automation/cancel/:jobId**
  - Test during download phase
  - Test during dubbing phase
  - Verify file cleanup
  - Check status update

- [ ] **POST /api/automation/retry/:jobId**
  - Test with failed job
  - Verify selective chunk retry
  - Check status reset
  - Test error handling

#### File Download
- [ ] **GET /api/automation/download/:jobId**
  - Test with completed job
  - Test with large file (>100MB)
  - Verify streaming (not buffering)
  - Check headers (content-type, disposition)
  - Test error for incomplete job

#### Job Management
- [ ] **GET /api/automation/jobs**
  - Test pagination (limit, offset)
  - Test status filtering
  - Verify job count accuracy
  - Check response format

- [ ] **DELETE /api/automation/jobs/:jobId**
  - Test with completed job
  - Test with failed job
  - Verify file cleanup
  - Test error for running job
  - Check 404 for invalid ID

---

### 3. UI Testing

#### Automation Form Page
- [ ] **URL Input & Validation**
  - Enter valid YouTube URL
  - Enter invalid URL
  - Test URL clearing when changed
  - Verify required field validation

- [ ] **Get Estimate Button**
  - Click with valid URL
  - Click with empty URL
  - Verify loading state
  - Check error display
  - Verify estimate card appears

- [ ] **Configuration Options**
  - Test chunk duration selector (30s, 1min, 2min, 5min)
  - Test language dropdown
  - Test parallel jobs slider (1-5)
  - Test watermark checkbox
  - Verify estimates update on change

- [ ] **Submit Button**
  - Verify disabled when no estimate
  - Test successful submission
  - Check redirect to progress page
  - Verify error handling

#### Progress Page
- [ ] **Real-Time Updates**
  - Verify SSE connection established
  - Check progress bar updates
  - Test stage indicators
  - Verify log display
  - Test auto-scroll behavior

- [ ] **Action Buttons**
  - Test download button (on completion)
  - Test retry button (on failure)
  - Test cancel button (while running)
  - Verify button states

- [ ] **CompletionCard**
  - Verify statistics display
  - Test download functionality
  - Check navigation buttons
  - Verify visual design

#### History Page
- [ ] **Job List Display**
  - Verify all jobs shown
  - Check status badges
  - Test pagination
  - Verify job card information

- [ ] **Filtering**
  - Test "all" filter
  - Test "complete" filter
  - Test "failed" filter
  - Test "dubbing" filter
  - Test "pending" filter

- [ ] **Delete Functionality**
  - Click delete on completed job
  - Verify confirmation dialog
  - Check job removal
  - Test delete on failed job
  - Verify error for running job

- [ ] **Error Display**
  - Verify ErrorDisplay component usage
  - Test dismiss functionality
  - Check retry integration
  - Verify suggestions appear

---

### 4. Edge Cases & Stress Testing

#### Video Length Extremes
- [ ] **Very Short Video (< 30 seconds)**
  - Test with 10-second video
  - Verify chunk handling
  - Check cost calculation
  - Test pipeline completion

- [ ] **Very Long Video (> 1 hour)**
  - Test with 90-minute video
  - Verify chunking strategy
  - Check memory usage
  - Test pipeline stability

#### Error Scenarios
- [ ] **Invalid YouTube URL**
  - Test with random string
  - Test with non-YouTube URL
  - Verify error message clarity

- [ ] **Network Failure**
  - Simulate network disconnection during download
  - Test retry mechanism
  - Verify error recovery

- [ ] **API Rate Limit**
  - Test with rapid successive requests
  - Verify queue management
  - Check backoff behavior

- [ ] **Disk Space Issues**
  - Test with limited disk space
  - Verify graceful degradation
  - Check error messages

#### Job Lifecycle
- [ ] **Cancellation at Different Stages**
  - Cancel during download
  - Cancel during chunking
  - Cancel during dubbing
  - Cancel during merging
  - Verify cleanup in each case

- [ ] **Retry After Partial Failure**
  - Fail specific chunks
  - Retry failed chunks
  - Verify successful chunks preserved
  - Check final output integrity

---

### 5. System & Performance Testing

#### File Management
- [ ] **Intermediate File Cleanup**
  - Verify source files deleted after chunking
  - Check chunk files deleted after merging
  - Verify dubbed audio deleted after merge
  - Test cleanup on success

- [ ] **Output File Retention**
  - Verify 24-hour retention
  - Test scheduled cleanup
  - Check manual deletion

- [ ] **Orphaned Files**
  - Simulate crash during processing
  - Verify cleanup on restart

#### Performance
- [ ] **Memory Leaks**
  - Monitor memory during long job
  - Check for leaked EventEmitters
  - Verify stream cleanup

- [ ] **Concurrent Jobs**
  - Start 3 jobs simultaneously
  - Verify all complete successfully
  - Check resource usage
  - Test queue behavior

#### Data Accuracy
- [ ] **Cost Calculations**
  - Compare with actual ElevenLabs pricing
  - Verify watermark discount
  - Test rounding

- [ ] **Time Estimates**
  - Compare estimated vs actual time
  - Test across different video lengths
  - Verify formula accuracy

#### Multi-Language Support
- [ ] **Different Target Languages**
  - Test Spanish (es)
  - Test French (fr)
  - Test German (de)
  - Test Japanese (ja)
  - Verify all work correctly

#### FFmpeg Verification
- [ ] **Command Accuracy**
  - Review chunking command
  - Review audio replacement command
  - Review concatenation command
  - Verify no unnecessary re-encoding

---

## Testing Execution Plan

### Phase 1: Code Review (2-3 hours)
1. Review all service files
2. Check TypeScript types
3. Verify logic flow
4. Document findings

### Phase 2: Unit Testing (3-4 hours)
1. Test each service in isolation
2. Mock dependencies
3. Verify error handling
4. Test edge cases

### Phase 3: API Testing (2-3 hours)
1. Test each endpoint manually
2. Use Postman/curl for API calls
3. Verify request/response formats
4. Test error scenarios

### Phase 4: UI Testing (2-3 hours)
1. Test complete user workflows
2. Verify real-time updates
3. Test error displays
4. Check responsive design

### Phase 5: Integration Testing (3-4 hours)
1. Test full pipeline end-to-end
2. Test with real YouTube videos
3. Verify file handling
4. Test concurrent operations

### Phase 6: Edge Case Testing (2-3 hours)
1. Test extreme inputs
2. Simulate failures
3. Test recovery mechanisms
4. Verify error messages

---

## Issue Tracking

### Critical Issues
- [ ] Issues that prevent basic functionality
- [ ] Data loss or corruption
- [ ] Security vulnerabilities

### High Priority
- [ ] Incorrect calculations
- [ ] Poor error messages
- [ ] Performance issues

### Medium Priority
- [ ] UI/UX improvements
- [ ] Missing validation
- [ ] Code quality issues

### Low Priority
- [ ] Documentation typos
- [ ] Minor UI polish
- [ ] Code cleanup

---

## Success Criteria

- ✅ All API endpoints return expected responses
- ✅ UI displays correct information in real-time
- ✅ Files are created and cleaned up properly
- ✅ Error messages are clear and actionable
- ✅ Cost calculations match actual pricing
- ✅ Pipeline completes successfully for test videos
- ✅ No memory leaks detected
- ✅ Concurrent jobs handled correctly
- ✅ Edge cases handled gracefully

---

## Test Environment Setup

### Prerequisites
- Node.js 18+ installed
- FFmpeg installed and in PATH
- ElevenLabs API key configured
- At least 5GB free disk space
- Stable internet connection

### Test Data
- Short video URL (< 1 min)
- Medium video URL (5-10 min)
- Long video URL (30-60 min)
- Various language targets
- Invalid URLs for error testing

---

## Progress Tracking

Total Tasks: 80+
Completed: 0
In Progress: 0
Blocked: 0
Failed: 0

Last Updated: [Date]
