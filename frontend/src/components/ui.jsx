import { useEffect, useState } from 'react';
import { Loader2, X, Inbox } from 'lucide-react';
import { subscribeLoading } from '../api';

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => setMounted(false), 160);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92vh] w-full ${widths[size]} flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl
          ${closing ? 'animate-scale-out' : 'animate-scale-in'}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4 no-print">
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <button className="btn-ghost -mr-2 p-2" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="scroll-thin overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3 no-print">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className={danger ? 'btn-primary' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner />} {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}

export function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin-slow" />;
}

export function TopLoadingBar() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let timer;
    const unsubscribe = subscribeLoading((n) => {
      clearTimeout(timer);
      timer = n > 0 ? setTimeout(() => setActive(true), 120) : setTimeout(() => setActive(false), 150);
    });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, []);
  return (
    <div className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden transition-opacity duration-200 no-print ${active ? 'opacity-100' : 'opacity-0'}`}>
      <div className="h-full w-full bg-linear-to-r from-primary-dark via-[#F04A50] to-primary animate-loading-bar" />
    </div>
  );
}

export function BrandLoader({ message = 'Loading…', size = 72 }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 animate-fade-in" role="status" aria-live="polite">
      <div className="relative" style={{ width: size + 16, height: size + 16 }}>
        <span className="absolute inset-0 rounded-full border-4 border-primary/15 border-t-primary animate-ring-spin" />
        <img src="/logo.png" alt="" className="absolute inset-2 rounded-full border-2 border-white bg-white object-cover shadow-md animate-logo-bounce" style={{ width: size, height: size }} />
      </div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-primary animate-dot-wave" style={{ animationDelay: `${i * 0.16}s` }} />
        ))}
      </div>
      <p className="text-sm font-medium text-muted">{message}</p>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center animate-fade-in">
      <div className="mb-3 rounded-2xl bg-page p-4 text-muted">
        <Icon size={28} />
      </div>
      <p className="font-semibold">{title}</p>
      {message && <p className="mt-1 max-w-xs text-sm text-muted">{message}</p>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center animate-fade-in">
      <p className="text-sm text-primary">{message}</p>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-primary">{error}</span>}
    </label>
  );
}
