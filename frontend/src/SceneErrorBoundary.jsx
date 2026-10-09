import { Component } from 'react'

// A "loading data successfully" fetch can still crash later, during render,
// if the data isn't shaped the way the rendering code expects (e.g. the SST
// grid response wasn't a plain array). Regular try/catch around fetch() does
// NOT catch that — only a React error boundary does. Without this, that kind
// of crash silently kills the WebGL canvas and leaves a blank screen with no
// on-page message (only visible in the browser console).
export default class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="panel"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            textAlign: 'center',
            padding: '18px 22px',
            maxWidth: 320,
          }}
        >
          <p style={{ color: 'var(--danger)', fontWeight: 600, margin: 0 }}>
            Something went wrong rendering the ocean data.
          </p>
          <p className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            {this.state.error.message}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: 0 }}>
            This usually means the data from the backend wasn&rsquo;t shaped the way the
            frontend expected. Check the browser console for the full error, and
            compare it against the API doc.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
