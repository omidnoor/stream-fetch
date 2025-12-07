'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AutomationJob, ListJobsResponse } from '@/services/automation';
import { ErrorDisplay } from '@/components/automation/ErrorDisplay';

export default function HistoryPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchJobs();
  }, [filter, page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: (page * ITEMS_PER_PAGE).toString(),
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/automation/jobs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data: ListJobsResponse = await response.json();
      setJobs(data.jobs);
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
      case 'downloading':
      case 'chunking':
      case 'dubbing':
      case 'merging':
      case 'finalizing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job History</h1>
        <p className="text-gray-600">View all your automation jobs</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {['all', 'complete', 'failed', 'dubbing', 'pending'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setPage(0);
            }}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              filter === status
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
          title="Failed to Load Jobs"
          onDismiss={() => setError(null)}
          onRetry={fetchJobs}
        />
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No jobs found</p>
          <button
            onClick={() => router.push('/automation')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start New Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/automation/${job.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{job.videoInfo.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Duration:</span>{' '}
                      {formatDuration(job.videoInfo.duration)}
                    </div>
                    <div>
                      <span className="font-medium">Language:</span>{' '}
                      {job.config.targetLanguage.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">Chunks:</span>{' '}
                      {Math.ceil(job.videoInfo.duration / job.config.chunkDuration)}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {job.status !== 'complete' && job.status !== 'failed' && job.status !== 'cancelled' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{job.progress.overallPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress.overallPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {job.status === 'failed' && job.error && (
                <div className="mt-4">
                  <ErrorDisplay
                    error={job.error}
                    title="Job Failed"
                    showDetails={true}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 0 || hasMore) && (
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">Page {page + 1}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
