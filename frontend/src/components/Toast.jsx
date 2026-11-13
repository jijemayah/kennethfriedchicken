import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 250);
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );

  const toast = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg
              ${t.type === 'error' ? 'border-primary/30' : 'border-emerald-200'}
              ${t.leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
          >
            {t.type === 'error' ? (
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            )}
            <p className="flex-1 text-sm">{t.message}</p>
            <button className="text-muted transition hover:text-ink" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
