import React, { useState, useCallback } from 'react'
import { getOceanPrediction } from './aiOceanAdvisor.js'

export default function PredictionPanel({ info }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handlePredict = useCallback(async () => {
    setState('loading')
    setErrorMsg('')
    try {
      const result = await getOceanPrediction(info)
      setText(result.prediction)
      setSource(result.source)
      setState('done')
    } catch (err) {
      setState('error')
      setErrorMsg(err.message || 'Prediction failed.')
    }
  }, [info])

  return (
    <div style={{ marginTop: 7, paddingTop: 7, borderTop: '1px solid var(--line)' }}>
      {state === 'idle' && (
        <button
          onClick={handlePredict}
          className="btn-live"
          style={{
            background: 'var(--accent)',
            color: 'var(--deep)',
            border: 'none',
            borderRadius: 2,
            padding: '4px 9px',
            fontSize: '0.68rem',
            fontWeight: 600,
            cursor: 'pointer',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <SparkIcon />
          AI ocean synthesis
        </button>
      )}

      {state === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: '0.68rem' }}>
          <ScanBar />
          Synthesizing ocean telemetry&hellip;
        </div>
      )}

      {state === 'done' && (
        <div>
          <div style={{ fontSize: '0.7rem', lineHeight: 1.45, color: 'var(--text)' }}>{text}</div>
          <div className="panel-label" style={{ marginTop: 4, fontSize: '0.58rem', color: 'var(--accent)' }}>
            AI Intelligence &middot; {source}
          </div>
        </div>
      )}

      {state === 'error' && (
        <div style={{ fontSize: '0.65rem', color: 'var(--danger)', maxWidth: 200, whiteSpace: 'normal' }}>
          {errorMsg}
        </div>
      )}
    </div>
  )
}

function SparkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  )
}

function ScanBar() {
  return (
    <span
      style={{
        position: 'relative',
        width: 34,
        height: 4,
        borderRadius: 2,
        background: 'var(--accent-soft)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '50%',
          background: 'var(--accent)',
          animation: 'scan-bar 1.2s ease-in-out infinite alternate',
        }}
      />
    </span>
  )
}
