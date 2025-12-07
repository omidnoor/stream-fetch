import { useState } from 'react';
import type { JobError } from '@/services/automation';

interface ErrorDisplayProps {
  error: string | JobError | null;
  title?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDisplay({
  error,
  title = 'Error',
  showDetails = false,
  onRetry,
  onDismiss,
}: ErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (!error) return null;

  const errorObj = typeof error === 'string' ? { message: error } : error;
  const hasDetails = errorObj.code || errorObj.details || errorObj.stack;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold text-red-900">{title}</h3>
          </div>

          <p className="text-red-700 mb-2">{errorObj.message}</p>

          {errorObj.code && (
            <p className="text-sm text-red-600 mb-2">Error Code: {errorObj.code}</p>
          )}

          {hasDetails && showDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-red-600 hover:text-red-800 underline mb-2"
            >
              {expanded ? 'Hide' : 'Show'} details
            </button>
          )}

          {expanded && (
            <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-x-auto">
              {errorObj.details && (
                <div className="mb-2">
                  <strong>Details:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{errorObj.details}</pre>
                </div>
              )}
              {errorObj.stack && process.env.NODE_ENV === 'development' && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{errorObj.stack}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 ml-4"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-3">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {getErrorSuggestion(errorObj.message) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Suggestion:</strong> {getErrorSuggestion(errorObj.message)}
          </p>
        </div>
      )}
    </div>
  );
}

function getErrorSuggestion(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Check your internet connection and try again.';
  }

  if (lowerMessage.includes('quota') || lowerMessage.includes('rate limit')) {
    return 'You have exceeded the API rate limit. Please wait a few minutes before trying again.';
  }

  if (lowerMessage.includes('api key') || lowerMessage.includes('authentication')) {
    return 'Check that your API key is configured correctly in the environment variables.';
  }

  if (lowerMessage.includes('disk') || lowerMessage.includes('space')) {
    return 'Free up some disk space and try again.';
  }

  if (lowerMessage.includes('ffmpeg')) {
    return 'Make sure FFmpeg is installed and accessible in your PATH.';
  }

  if (lowerMessage.includes('timeout')) {
    return 'The operation took too long. Try reducing the chunk duration or video length.';
  }

  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return 'The requested resource was not found. It may have been deleted or moved.';
  }

  return null;
}
