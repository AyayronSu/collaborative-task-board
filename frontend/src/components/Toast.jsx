// frontend/src/components/Toast.jsx
import { useEffect } from 'react'

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [toast.id])

  return (
    <div className={`toast ${toast.type}`}>
      <span>{toast.message}</span>
      <button className="toast-dismiss" onClick={() => onDismiss(toast.id)}>×</button>
    </div>
  )
}