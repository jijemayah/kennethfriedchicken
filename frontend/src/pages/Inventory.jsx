import { useMemo, useState } from 'react';
import { Search, PackagePlus, PackageMinus, ClipboardCheck, AlertTriangle, Boxes, SlidersHorizontal } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { Modal, PageHeader, TableSkeleton, EmptyState, ErrorBox, Field, Spinner } from '../components/ui';
import { dateTime, useApi } from '../utils';

export default function Inventory({ user }) {
  const toast = useToast();
  const inventory = useApi('/inventory');
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [adjusting, setAdjusting] = useState(null);
  const canEdit = user.canManageInventory;

  const rows = useMemo(
    () => (inventory.data || []).filter((i) => (!lowOnly || i.lowStock) && i.productName.toLowerCase().includes(search.toLowerCase())),
    [inventory.data, search, lowOnly],
  );
  const lowCount = (inventory.data || []).filter((i) => i.lowStock).length;
  const totalUnits = (inventory.data || []).reduce((s, i) => s + i.quantity, 0);

  const onSaved = (updated) => {
    inventory.setData((list) => list.map((i) => (i.productId === updated.productId ? updated : i)));
    setAdjusting(null);
    toast.success(`${updated.productName}: ${updated.quantity} in stock`);
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle={canEdit ? 'Receive deliveries and correct stock counts.' : 'Current stock levels (view only).'} />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat icon={Boxes} label="Products tracked" value={inventory.data?.length ?? '–'} />
        <Stat icon={SlidersHorizontal} label="Total units" value={inventory.data ? totalUnits : '–'} />
        <Stat icon={AlertTriangle} label="Low stock" value={inventory.data ? lowCount : '–'} warn={lowCount > 0} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-10" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Low stock only
          </label>
        </div>

        {inventory.error ? (
          <div className="p-4"><ErrorBox message={inventory.error} onRetry={inventory.reload} /></div>
        ) : inventory.loading && !inventory.data ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing to show" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-page/60">
                <tr><th className="th">Product</th><th className="th">Category</th><th className="th">Stock level</th><th className="th text-right">Reorder at</th><th className="th">Updated</th>{canEdit && <th className="th" />}</tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const pct = Math.min(100, (item.quantity / Math.max(item.reorderLevel * 3, 1)) * 100);
                  return (
                    <tr key={item.productId} className="border-t border-line transition-colors hover:bg-page/60">
                      <td className="td font-semibold">{item.productName}</td>
                      <td className="td text-muted">{item.categoryName}</td>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <span className={`w-10 text-right font-semibold ${item.lowStock ? 'text-primary' : ''}`}>{item.quantity}</span>
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-page">
                            <div className={`h-full rounded-full transition-all duration-500 ${item.lowStock ? 'bg-primary' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          {item.lowStock && <span className="badge bg-primary/10 text-primary">Low</span>}
                        </div>
                      </td>
                      <td className="td text-right text-muted">{item.reorderLevel}</td>
                      <td className="td text-xs text-muted">{dateTime(item.updatedAt)}</td>
                      {canEdit && (
                        <td className="td text-right">
                          <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setAdjusting(item)}>Edit stock</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdjustModal item={adjusting} onClose={() => setAdjusting(null)} onSaved={onSaved} />
    </div>
  );
}

function Stat({ icon: Icon, label, value, warn }) {
  return (
    <div className="card flex items-center gap-4 p-4 animate-rise">
      <span className={`rounded-xl p-2.5 ${warn ? 'bg-primary/10 text-primary' : 'bg-page text-muted'}`}><Icon size={20} /></span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="font-display text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function AdjustModal({ item, onClose, onSaved }) {
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState('');
  const [reorder, setReorder] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);

  if (item && item !== last) {
    setLast(item);
    setMode('add');
    setAmount('');
    setReorder(String(item.reorderLevel));
    setError('');
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      // One request: the backend applies the difference with addStock/removeStock.
      const updated = await api(`/inventory/${item.productId}`, {
        method: 'PUT',
        body: { quantity: preview, reorderLevel: Number(reorder) },
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const n = Number(amount || 0);
  const preview = !item ? 0 : mode === 'set' ? (amount === '' ? item.quantity : n) : item.quantity + (mode === 'add' ? n : -n);

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={`Edit stock — ${item?.productName || ''}`}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" form="adjust-form" disabled={busy || preview < 0 || !Number.isInteger(preview)}>{busy && <Spinner />} Save</button>
        </>
      }
    >
      <form id="adjust-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[['add', 'Stock in', PackagePlus], ['remove', 'Stock out', PackageMinus], ['set', 'Set count', ClipboardCheck]].map(([key, label, Icon]) => (
            <button type="button" key={key} onClick={() => { setMode(key); setAmount(''); }}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all cursor-pointer active:scale-95
                ${mode === key ? 'border-primary bg-primary/5 text-primary' : 'border-line text-muted hover:text-ink'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        <Field label={{ add: 'Units received', remove: 'Units to remove (spoilage, waste)', set: 'Exact count on hand' }[mode]}>
          <input className="input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        <div className="flex justify-between rounded-xl bg-page px-4 py-3 text-sm">
          <span className="text-muted">New quantity</span>
          <span className={`font-bold ${preview < 0 ? 'text-primary' : ''}`}>{item?.quantity} → {preview}</span>
        </div>
        <Field label="Reorder level"><input className="input" type="number" min="0" value={reorder} onChange={(e) => setReorder(e.target.value)} /></Field>
        {error && <p className="rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-primary">{error}</p>}
      </form>
    </Modal>
  );
}
