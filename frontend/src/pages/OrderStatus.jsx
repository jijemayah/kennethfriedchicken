import { useCallback, useEffect, useState } from 'react';
import { ChefHat, BellRing, Bike, CheckCircle2, RefreshCw, Eye, ArrowRight, Clock } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { PageHeader, Skeleton, ErrorBox, Spinner } from '../components/ui';
import { ReceiptModal } from '../components/Receipt';
import { money, today, minutesAgo, ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '../utils';

const ICONS = { PREPARING: ChefHat, READY: BellRing, OUT_FOR_DELIVERY: Bike, COMPLETED: CheckCircle2 };
const REFRESH_MS = 20000;
const DONE_LIMIT = 8;

export default function OrderStatus() {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [showAllDone, setShowAllDone] = useState(false);
  const [, setTick] = useState(0);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const day = today();
      setOrders(await api(`/orders?from=${day}&to=${day}&status=COMPLETED`));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load(true);
      setTick((t) => t + 1);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const changeStatus = async (order, status) => {
    if (!status || status === order.orderStatus) return;
    setBusyId(order.id);
    try {
      const updated = await api(`/orders/${order.id}/status`, { method: 'POST', body: { status } });
      setOrders((list) => list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
      toast.success(`${updated.receiptNumber} is now ${updated.orderStatusLabel.toLowerCase()}`);
    } catch (e) {
      toast.error(e.message);
      load(true);
    } finally {
      setBusyId(null);
    }
  };

  const view = async (id) => {
    try {
      setViewing(await api(`/orders/${id}`));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const list = orders || [];
  const active = list.filter((o) => o.orderStatus !== 'COMPLETED').length;

  return (
    <div>
      <PageHeader
        title="Order Status"
        subtitle={orders ? `${active} active ${active === 1 ? 'order' : 'orders'} today. Updates every 20 seconds.` : "Today's orders, from the kitchen to the customer."}
      >
        <button className="btn-secondary" onClick={() => load()} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin-slow' : ''} /> Refresh
        </button>
      </PageHeader>

      {error && !orders ? (
        <ErrorBox message={error} onRetry={() => load()} />
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ORDER_STATUSES.map((column) => {
            const Icon = ICONS[column.key];
            const cards = list
              .filter((o) => o.orderStatus === column.key)
              .sort((a, b) => (column.key === 'COMPLETED'
                ? new Date(b.createdAt) - new Date(a.createdAt)
                : new Date(a.createdAt) - new Date(b.createdAt)));
            return (
              <section key={column.key} className="flex min-w-0 flex-col rounded-2xl border border-line bg-page/70">
                <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                    <h2 className="font-display text-sm font-semibold">{column.label}</h2>
                  </div>
                  <span className={`badge ${column.badge}`}>{orders ? cards.length : '–'}</span>
                </header>

                <div className="flex flex-col gap-3 p-3">
                  {!orders ? (
                    <>
                      <Skeleton className="h-36" />
                      <Skeleton className="h-36" />
                    </>
                  ) : cards.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-2 py-8 text-center text-sm text-muted">
                      <Icon size={22} />
                      {column.key === 'OUT_FOR_DELIVERY' ? 'No delivery orders on the road' : `No ${column.label.toLowerCase()} orders`}
                    </div>
                  ) : (
                    <>
                      {(column.key === 'COMPLETED' && !showAllDone ? cards.slice(0, DONE_LIMIT) : cards).map((o) => (
                        <OrderCard
                          key={o.id}
                          order={o}
                          busy={busyId === o.id}
                          onChange={changeStatus}
                          onView={() => view(o.id)}
                        />
                      ))}
                      {column.key === 'COMPLETED' && cards.length > DONE_LIMIT && (
                        <button className="btn-ghost w-full py-2 text-xs" onClick={() => setShowAllDone((v) => !v)}>
                          {showAllDone ? 'Show fewer' : `Show all ${cards.length} completed`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <ReceiptModal open={Boolean(viewing)} order={viewing} onClose={() => setViewing(null)} title={`Order ${viewing?.receiptNumber || ''}`} />
    </div>
  );
}

function OrderCard({ order, busy, onChange, onView }) {
  const done = order.orderStatus === 'COMPLETED';
  const NextIcon = ICONS[order.nextOrderStatus] || ArrowRight;
  return (
    <article className={`card animate-rise p-4 transition ${done ? 'opacity-80' : 'hover:-translate-y-0.5 hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base font-bold leading-tight">{order.receiptNumber}</p>
          <p className="truncate text-sm text-muted">{order.customerName || 'Walk-in'}</p>
        </div>
        <span className="badge shrink-0 bg-primary/10 text-primary">{ORDER_TYPE_LABELS[order.orderType] || order.orderTypeLabel}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><Clock size={13} /> {minutesAgo(order.createdAt)}</span>
        <span>{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</span>
        <span className="font-semibold text-ink">{money(order.total)}</span>
      </div>

      {order.canUpdateStatus && (
        <div className="mt-4 flex flex-col gap-2">
          {order.nextOrderStatus && (
            <button className="btn-primary w-full py-2" disabled={busy} onClick={() => onChange(order, order.nextOrderStatus)}>
              {busy ? <Spinner /> : <NextIcon size={16} />}
              {order.nextOrderStatus === 'COMPLETED' ? 'Mark completed' : `Mark ${order.nextOrderStatusLabel.toLowerCase()}`}
            </button>
          )}
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`status-${order.id}`}>Change status of {order.receiptNumber}</label>
            <select
              id={`status-${order.id}`}
              className="input flex-1 py-2 text-xs"
              value={order.orderStatus}
              disabled={busy}
              onChange={(e) => onChange(order, e.target.value)}
            >
              {order.allowedOrderStatuses.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button className="btn-secondary px-3 py-2" onClick={onView} aria-label={`View ${order.receiptNumber}`}>
              <Eye size={15} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
