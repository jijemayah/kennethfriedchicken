import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { PageHeader, TableSkeleton, EmptyState, ErrorBox, Skeleton } from '../components/ui';
import { ReceiptModal } from '../components/Receipt';
import { dateTime, money, useApi, PAYMENT_LABELS, PAYMENT_STYLES } from '../utils';

export default function Orders() {
  const toast = useToast();
  const [filters, setFilters] = useState({ from: '', to: '', method: '', q: '' });
  const [applied, setApplied] = useState(filters);
  const [selected, setSelected] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const query = new URLSearchParams(Object.entries(applied).filter(([, v]) => v)).toString();
  const orders = useApi(`/orders${query ? `?${query}` : ''}`);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    setApplied(filters);
  };
  const reset = () => {
    const empty = { from: '', to: '', method: '', q: '' };
    setFilters(empty);
    setApplied(empty);
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

  const list = orders.data || [];
  const sum = list.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div>
      <PageHeader title="Order History" subtitle="Search past transactions and reprint receipts." />

      <form onSubmit={submit} className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-10" placeholder="Receipt #, customer, or cashier" value={filters.q} onChange={set('q')} />
        </div>
        <input className="input" type="date" value={filters.from} onChange={set('from')} aria-label="From date" />
        <input className="input" type="date" value={filters.to} onChange={set('to')} aria-label="To date" />
        <select className="input" value={filters.method} onChange={set('method')}>
          <option value="">All payments</option>
          <option value="CASH">Cash</option>
          <option value="GCASH">GCash</option>
          <option value="CARD">Card</option>
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
              <span className="text-muted">{list.length} orders</span>
              <span className="font-semibold">Total {money(sum)}</span>
            </>
          ) : (
            <Skeleton className="h-5 w-40" />
          )}
        </div>
        {orders.error ? (
          <div className="p-4"><ErrorBox message={orders.error} onRetry={orders.reload} /></div>
        ) : orders.loading ? (
          <TableSkeleton />
        ) : list.length === 0 ? (
          <EmptyState title="No orders found" message="Try a different date range or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-page/60">
                <tr><th className="th">Receipt</th><th className="th">Date</th><th className="th">Customer</th><th className="th">Cashier</th><th className="th text-right">Items</th><th className="th">Payment</th><th className="th text-right">Total</th><th className="th" /></tr>
              </thead>
              <tbody>
                {list.map((o, i) => (
                  <tr key={o.id} onClick={() => open(o.id)} className="cursor-pointer border-t border-line transition-colors hover:bg-page/60 animate-fade-in" style={{ animationDelay: `${Math.min(i, 15) * 15}ms` }}>
                    <td className="td font-semibold">{o.receiptNumber}</td>
                    <td className="td text-muted">{dateTime(o.createdAt)}</td>
                    <td className="td">{o.customerName || <span className="text-muted">Walk-in</span>}</td>
                    <td className="td text-muted">{o.employeeName}</td>
                    <td className="td text-right">{o.itemCount}</td>
                    <td className="td"><span className={`badge ${PAYMENT_STYLES[o.payment?.method] || ''}`}>{PAYMENT_LABELS[o.payment?.method]}</span></td>
                    <td className="td text-right font-semibold">{money(o.total)}</td>
                    <td className="td text-right">
                      <span className="inline-flex text-muted">{loadingId === o.id ? <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-primary border-t-transparent" /> : <Eye size={16} />}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReceiptModal open={Boolean(selected)} order={selected} onClose={() => setSelected(null)} title={`Order ${selected?.receiptNumber || ''}`} />
    </div>
  );
}
