import { useEffect } from "react";

export default function Toast({ toasts, onDismiss }) {
    return (
        <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 200,
            maxWidth: '320px',
        }}>
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    )
}

function ToastItem({ toast, onDismiss }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000)
        return () => clearTimeout(timer)
    }, [toast.id])

    const colors = {
        error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b' },
        warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e' },
        info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af' },
        success: { bg: '#f0fdf4', border: '#86efac', color: '#166534' },
    }

    const style = colors[toast.type] ?? colors.info

    return (
        <div style={{
            background: style.bg,
            border: `1px solid ${style.border}`,
            color: style.color,
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            lineHeight: '1.4',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
            <span>{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                opacity: 0.6,
                padding: 0,
                fontSize: '1rem',
                lineHeight: 1,
                flexShrink: 0,
                }}
            >×</button>
        </div>
    )
}