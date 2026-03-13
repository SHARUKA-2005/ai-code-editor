// ReviewPanel.jsx — Displays the AI review output
// Handles three states: empty (waiting), loading, and result (success/error).

import React from 'react'
import ReactMarkdown from 'react-markdown'

/**
 * Props:
 *  - review   {string|null}  The AI-generated markdown review text
 *  - status   {'idle'|'loading'|'error'}
 *  - errorMsg {string}       Error description (only used when status === 'error')
 */
export default function ReviewPanel({ review, status, errorMsg }) {
  return (
    <>
      {/* Panel header */}
      <div className="review-panel-header">
        <div className="review-panel-title">
          <span>🔍</span>
          <span>AI Review</span>
        </div>
        <span className="ai-badge">GEMINI</span>
      </div>

      {/* Panel body */}
      <div className="review-content">

        {/* LOADING STATE — spinner while waiting for Gemini */}
        {status === 'loading' && (
          <div className="review-loading">
            <div className="review-loading-spinner" />
            <p>Gemini is reviewing your code…</p>
          </div>
        )}

        {/* ERROR STATE — show when the API call fails */}
        {status === 'error' && (
          <div className="review-error">
            <div className="review-error-title">
              <span>⚠️</span>
              <span>Review Failed</span>
            </div>
            <p>{errorMsg || 'An unexpected error occurred. Please try again.'}</p>
          </div>
        )}

        {/* RESULT STATE — render Gemini markdown response */}
        {status === 'idle' && review && (
          <div className="review-markdown">
            {/*
              react-markdown safely renders the Gemini response as formatted HTML.
              This gives us headers, code blocks, bullet lists etc.
            */}
            <ReactMarkdown>{review}</ReactMarkdown>
          </div>
        )}

        {/* EMPTY STATE — before user clicks Review */}
        {status === 'idle' && !review && (
          <div className="review-empty">
            <div className="review-empty-icon">💡</div>
            <h3>Ready to Review</h3>
            <p>
              Write or paste your code in the editor, then click{' '}
              <strong>✨ Review Code</strong> to get AI feedback.
            </p>
          </div>
        )}

      </div>
    </>
  )
}
