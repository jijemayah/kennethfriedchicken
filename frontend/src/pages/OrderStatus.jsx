import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChefHat, BellRing, Bike, CheckCircle2, RefreshCw, Eye, Clock, Search, X, CalendarClock } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { PageHeader, Skeleton, ErrorBox, Spinner, EmptyState } from '../components/ui';
import { ReceiptModal } from '../components/Receipt';
import { money, today, storeDate, minutesAgo, ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '../utils';

const ICONS = { PREPARING: ChefHat, READY: BellRing, OUT_FOR_DELIVERY: Bike, COMPLETED: CheckCircle2 };
const TABS = ORDER_STATUSES.filter((s) => s.key !== 'COMPLETED');
const REFRESH_MS = 20000;
const LATE_MINUTES = 15;

export default function OrderStatus() {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [tab, setTab] = useState('PREPARING');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [, setTick] = useState(0);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      setOrders(await api('/orders/board'));
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

  const changeStatus = async (order, status, isUndo = false) => {
    if (!status || status === order.orderStatus) return;
    const previous = order.orderStatus;
    setBusyId(order.id);
    try {
      const updated = await api(`/orders/${order.id}/status`, { method: 'POST', body: { status } });
      setOrders((list) => {
        const rest = (list || []).filter((o) => o.id !== updated.id);
        return updated.orderStatus === 'COMPLETED' ? rest : [...rest, { ...order, ...updated }];
      });
      if (isUndo) {
        toast.success(`${updated.receiptNumber} is back in ${updated.orderStatusLabel.toLowerCase()}`);
      } else if (updated.orderStatus === 'COMPLETED') {
        toast.success(
          `${updated.receiptNumber} completed. It's now in Order History.`,
          updated.canUpdateStatus ? { label: 'Undo', onClick: () => changeStatus(updated, previous, true) } : undefined,
        );
      } else {
        toast.success(`${updated.receiptNumber} moved to ${updated.orderStatusLabel}`);
      }
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

  const all = orders || [];
  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    const digits = text.replace(/\D/g, '').replace(/^0+/, '');
    return all.filter((o) => {
      if (type && o.orderType !== type) return false;
      if (!text) return true;
      return (o.customerName || '').toLowerCase().includes(text)
        || (digits && String(o.id).includes(digits));
    });
  }, [all, search, type]);

  const counts = Object.fromEntries(TABS.map((t) => [t.key, filtered.filter((o) => o.orderStatus === t.key).length]));
  const visible = filtered
    .filter((o) => o.orderStatus === tab)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const typesOnBoard = [...new Set(all.map((o) => o.orderType))];
  const current = TABS.find((t) => t.key === tab);
  const filtering = Boolean(search.trim() || type);

  return (
    <div>
      <PageHeader
        title="Order Status"
        subtitle={orders
          ? `${all.length} unfinished ${all.length === 1 ? 'order' : 'orders'}. Completed orders move to Order History.`
          : 'Orders that still need to be prepared, picked up or delivered.'}
      >
        <button className="btn-secondary" onClick={() => load()} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin-slow' : ''} /> Refresh
        </button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3" role="tablist" aria-label="Order status">
        {TABS.map((t) => {
          const Icon = ICONS[t.key];
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 cursor-pointer active:scale-[0.99]
                ${active ? 'border-primary bg-white shadow-md shadow-primary/10 ring-2 ring-primary/15' : 'border-line bg-white/70 hover:border-primary/30 hover:bg-white'}`}
            >
              <span className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-primary text-white' : 'bg-page text-muted'}`}>
                  <Icon size={18} />
                </span>
                <span className={`font-display text-sm font-semibold ${active ? 'text-ink' : 'text-muted'}`}>{t.label}</span>
              </span>
              <span className={`font-display text-2xl font-bold tabular-nums ${active ? 'text-primary' : 'text-ink'}`}>
                {orders ? counts[t.key] : '–'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="card mb-4 flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="status-search"
            className="input pl-10"
            placeholder="Find by receipt no. or customer name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[['', 'All types'], ...typesOnBoard.map((k) => [k, ORDER_TYPE_LABELS[k] || k])].map(([key, label]) => (
            <button
              key={key || 'all'}
              onClick={() => setType(key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition cursor-pointer
                ${type === key ? 'border-primary bg-primary text-white' : 'border-line bg-white text-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && !orders ? (
        <ErrorBox message={error} onRetry={() => load()} />
      ) : !orders ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={filtering ? Search : ICONS[tab]}
            title={filtering ? 'No matching orders' : `No ${current.label.toLowerCase()} orders`}
            message={filtering ? 'Clear the search or pick another type.' : tab === 'OUT_FOR_DELIVERY' ? 'Delivery orders appear here once they leave the store.' : 'New orders show up here automatically.'}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((o) => (
            <OrderCard key={o.id} order={o} busy={busyId === o.id} onChange={changeStatus} onView={() => view(o.id)} />
          ))}
        </div>
      )}

      <ReceiptModal open={Boolean(viewing)} order={viewing} onClose={() => setViewing(null)} title={`Order ${viewing?.receiptNumber || ''}`} />
    </div>
  );
}

function OrderCard({ order, busy, onChange, onView }) {
  const waited = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const late = waited >= LATE_MINUTES;
  const earlierDay = storeDate(order.createdAt) !== today();
  const NextIcon = ICONS[order.nextOrderStatus] || CheckCircle2;

  return (
    <article className={`card animate-rise flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-md ${late ? 'border-amber-300 ring-2 ring-amber-100' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight">{order.receiptNumber}</p>
          <p className="truncate text-sm text-muted">{order.customerName || 'Walk-in'}</p>
        </div>
        <span className="badge shrink-0 bg-primary/10 text-primary">{ORDER_TYPE_LABELS[order.orderType] || order.orderTypeLabel}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className={`inline-flex items-center gap-1 ${late ? 'font-semibold text-amber-700' : ''}`}>
          <Clock size={13} /> {late ? `Waiting ${minutesAgo(order.createdAt).replace(' ago', '')}` : minutesAgo(order.createdAt)}
        </span>
        <span>{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</span>
        <span className="font-semibold text-ink">{money(order.total)}</span>
        {earlierDay && (
          <span className="badge bg-amber-50 text-amber-700">
            <CalendarClock size={12} /> From {new Date(order.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })}
          </span>
        )}
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
