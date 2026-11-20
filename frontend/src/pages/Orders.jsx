import { useState } from 'react';
import { Search, Eye, Ban, Undo2, CalendarClock } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { Modal, PageHeader, TableSkeleton, EmptyState, ErrorBox, Skeleton, Spinner } from '../components/ui';
import { ReceiptModal } from '../components/Receipt';
import { dateTime, money, useApi, PAYMENT_LABELS, PAYMENT_STYLES, ORDER_TYPE_LABELS, STATUS_STYLES } from '../utils';

const EMPTY = { from: '', to: '', method: '', status: '', q: '' };

export default function Orders({ user }) {
  const toast = useToast();
  const history = user.canViewSalesHistory;
  const [filters, setFilters] = useState(EMPTY);
  const [applied, setApplied] = useState(filters);
  const [selected, setSelected] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const query = new URLSearchParams(Object.entries(applied).filter(([, v]) => v)).toString();
  const orders = useApi(`/orders${query ? `?${query}` : ''}`);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    setApplied(filters);
  };
  const reset = () => {
    setFilters(EMPTY);
    setApplied(EMPTY);
  };

  const open = async (id) => {
    setLoadingId(id);
    try {
      setSelected(await api(`/orders/${id}`));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const onCancelled = (order) => {
    setCancelling(null);
    orders.setData((list) => list.map((o) => (o.id === order.id ? { ...o, ...order } : o)));
    toast.success(`${order.receiptNumber} ${order.status === 'VOIDED' ? 'voided, stock returned' : 'refunded'}`);
  };

  const list = orders.data || [];
  const completed = list.filter((o) => o.status === 'COMPLETED');
  const sum = completed.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div>
      <PageHeader
        title="Order History"
        subtitle={history
          ? 'Search past transactions, reprint receipts, and void or refund orders.'
          : "Today's orders only. Void or refund today's completed orders."}
      />

      {!history && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800 animate-rise">
          <CalendarClock size={17} /> The list resets at midnight (Philippine time). Ask a manager for older orders.
        </div>
      )}

      <form onSubmit={submit} className={`card mb-5 grid gap-3 p-4 sm:grid-cols-2 ${history ? 'lg:grid-cols-[1fr_auto_auto_auto_auto_auto]' : 'lg:grid-cols-[1fr_auto_auto_auto]'}`}>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-10" placeholder="Receipt #, customer, or cashier" value={filters.q} onChange={set('q')} />
        </div>
        {history && (
          <>
            <input className="input" type="date" value={filters.from} onChange={set('from')} aria-label="From date" />
            <input className="input" type="date" value={filters.to} onChange={set('to')} aria-label="To date" />
          </>
        )}
        <select className="input" value={filters.method} onChange={set('method')} aria-label="Payment method">
          <option value="">All payments</option>
          <option value="CASH">Cash</option>
          <option value="GCASH">GCash</option>
          <option value="CARD">Card</option>
        </select>
        <select className="input" value={filters.status} onChange={set('status')} aria-label="Status">
          <option value="">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOIDED">Voided</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <div className="flex gap-2">
          <button className="btn-primary flex-1">Search</button>
          <button type="button" className="btn-secondary" onClick={reset}>Reset</button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 text-sm">
          {orders.data ? (
            <>
              <span className="text-muted">{list.length} orders · {list.length - completed.length} voided/refunded</span>
              <span className="font-semibold">Completed total {money(sum)}</span>
            </>
          ) : (
            <Skeleton className="h-5 w-40" />
          )}
        </div>
        {orders.error ? (
          <div className="p-4"><ErrorBox message={orders.error} onRetry={orders.reload} /></div>
        ) : orders.loading && !orders.data ? (
          <TableSkeleton cols={7} />
        ) : list.length === 0 ? (
          <EmptyState title="No orders found" message={history ? 'Try a different date range or search.' : 'No orders yet today.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-page/60">
                <tr>
                  <th className="th">Receipt</th><th className="th">Date</th><th className="th">Type</th><th className="th">Customer</th>
                  <th className="th">Cashier</th><th className="th">Payment</th><th className="th text-right">Total</th>
                  <th className="th">Status</th><th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o, i) => (
                  <tr key={o.id} className={`border-t border-line transition-colors hover:bg-page/60 animate-fade-in ${o.status !== 'COMPLETED' ? 'text-muted' : ''}`} style={{ animationDelay: `${Math.min(i, 15) * 15}ms` }}>
                    <td className="td font-semibold">{o.receiptNumber}</td>
                    <td className="td text-muted">{dateTime(o.createdAt)}</td>
                    <td className="td text-xs">{ORDER_TYPE_LABELS[o.orderType]}</td>
                    <td className="td">
                      {o.customerName || <span className="text-muted">Walk-in</span>}
                      {o.discountType !== 'NONE' && <span className="ml-1.5 badge bg-emerald-50 text-emerald-700">{o.discountType === 'EMPLOYEE' ? 'EMP' : o.discountType}</span>}
                    </td>
                    <td className="td text-muted">{o.employeeName}</td>
                    <td className="td"><span className={`badge ${PAYMENT_STYLES[o.payment?.method] || ''}`}>{PAYMENT_LABELS[o.payment?.method]}</span></td>
                    <td className={`td text-right font-semibold ${o.status !== 'COMPLETED' ? 'line-through' : ''}`}>{money(o.total)}</td>
                    <td className="td"><span className={`badge ${STATUS_STYLES[o.status]}`}>{o.status.charAt(0) + o.status.slice(1).toLowerCase()}</span></td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost p-2" onClick={() => open(o.id)} aria-label="View receipt" title="View receipt">
                          {loadingId === o.id ? <Spinner size={15} /> : <Eye size={15} />}
                        </button>
                        {o.canVoid && (
                          <>
                            <button className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => setCancelling({ order: o, action: 'void' })} title="Void: money back, items back to stock">
                              <Ban size={13} /> Void
                            </button>
                            <button className="btn-danger px-2.5 py-1.5 text-xs" onClick={() => setCancelling({ order: o, action: 'refund' })} title="Refund: money back, stock stays deducted">
                              <Undo2 size={13} /> Refund
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReceiptModal open={Boolean(selected)} order={selected} onClose={() => setSelected(null)} title={`Order ${selected?.receiptNumber || ''}`} />
      <CancelModal target={cancelling} onClose={() => setCancelling(null)} onDone={onCancelled} />
    </div>
  );
}

const REASONS = {
  void: ['Wrong items punched in', 'Customer cancelled before serving', 'Duplicate transaction'],
  refund: ['Food quality complaint', 'Wrong order served', 'Long waiting time'],
};

function CancelModal({ target, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);

  if (target && target !== last) {
    setLast(target);
    setReason('');
    setError('');
  }

  const action = target?.action;
  const order = target?.order;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onDone(await api(`/orders/${order.id}/${action}`, { method: 'POST', body: { reason } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={busy ? undefined : onClose}
      title={`${action === 'void' ? 'Void' : 'Refund'} ${order?.receiptNumber || ''}`}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" form="cancel-form" disabled={busy || !reason.trim()}>
            {busy && <Spinner />} {action === 'void' ? 'Void order' : 'Refund order'}
          </button>
        </>
      }
    >
      <form id="cancel-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-page p-3 text-sm">
          <div className="flex justify-between"><span className="text-muted">Return to customer</span><b>{money(order?.total)}</b></div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted">Inventory</span>
            <span>{action === 'void' ? `${order?.itemCount} item(s) go back to stock` : 'Stays deducted'}</span>
          </div>
        </div>
        <p className="text-xs text-muted">
          {action === 'void'
            ? 'Use void when the sale was a mistake and the food was not served.'
            : 'Use refund when the food was already served. The amount is taken off today\'s sales.'}
        </p>
        <label className="block">
          <span className="label">Reason</span>
          <textarea className="input min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} required autoFocus />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(REASONS[action] || []).map((r) => (
            <button type="button" key={r} className="badge cursor-pointer bg-page text-muted transition hover:text-ink" onClick={() => setReason(r)}>{r}</button>
          ))}
        </div>
        {error && <p className="rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-primary animate-fade-in">{error}</p>}
      </form>
    </Modal>
  );
}
