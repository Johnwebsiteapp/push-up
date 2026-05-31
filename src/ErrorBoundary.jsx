import { Component } from 'react'

export default class ErrorBoundary extends Component {
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
        <div style={{
          padding: 24,
          fontFamily: 'monospace',
          fontSize: 13,
          color: '#ff5c5c',
          background: '#0f1111',
          minHeight: '100vh',
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
        }}>
          <strong>BŁĄD:</strong>{'\n\n'}
          {this.state.error.toString()}
          {'\n\n'}
          {this.state.error.stack}
        </div>
      )
    }
    return this.props.children
  }
}
