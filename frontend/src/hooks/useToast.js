import { useState, useCallback } from "react";

export default function useToast() {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'error', duration = 4000) => {
        const id = Date.now() + Math.random()
        setToasts(ts => [...ts, { id, message, type, duration }])
    }, [])

    const dismissToast = useCallback((id) => {
        setToasts(ts => ts.filter(t => t.id !== id))
    }, [])

    return { toasts, addToast, dismissToast }
}