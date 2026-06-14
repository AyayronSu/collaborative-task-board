import { Component } from "react";

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, message: '' }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, message: error?.message || 'Something went wrong.'}
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        textAlign: 'center',
                        maxWidth: '400px',
                        padding: '2rem',
                    }}>
                        <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</p>
                        <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong</h2>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {this.state.message}
                        </p>
                        <button 
                            className="primary"
                            onClick={() => window.location.reload()}
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}