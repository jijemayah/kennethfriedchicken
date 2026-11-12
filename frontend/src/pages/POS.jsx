import { useMemo, useRef, useState } from 'react';
import {
  Search, Minus, Plus, Trash2, ShoppingBag, Banknote, Smartphone, CreditCard, UserRound, X, PackageX,
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { Modal, Skeleton, Spinner, EmptyState, ErrorBox } from '../components/ui';
import { ReceiptModal } from '../components/Receipt';
import { cartTotals, categoryIcon, money, useApi } from '../utils';

export default function POS() {
  const toast = useToast();
  const products = useApi('/products');
  const categories = useApi('/categories');
  const customers = useApi('/customers');

  const [categoryId, setCategoryId] = useState(0);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [flashId, setFlashId] = useState(null);
  const [bump, setBump] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const visibleProducts = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (products.data || []).filter(
      (p) => (!categoryId || p.categoryId === categoryId) && (!text || p.name.toLowerCase().includes(text)),
    );
  }, [products.data, categoryId, search]);

  const activeLines = cart.filter((l) => !l.removing);
  const totals = cartTotals(activeLines);
  const itemCount = activeLines.reduce((n, l) => n + l.quantity, 0);

  // ---------------- cart actions ----------------
  const addToCart = (product) => {
    const inCart = cart.find((l) => l.id === product.id && !l.removing);
    if ((inCart?.quantity || 0) >= product.stock) {
      toast.error(`Only ${product.stock} ${product.name} in stock`);
      return;
    }
    setCart((lines) =>
      inCart
        ? lines.map((l) => (l.id === product.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...lines.filter((l) => l.id !== product.id), { id: product.id, name: product.name, price: product.price, stock: product.stock, categoryName: product.categoryName, quantity: 1 }],
    );
    setFlashId(product.id);
    setBump((b) => b + 1);
    setTimeout(() => setFlashId((id) => (id === product.id ? null : id)), 450);
  };

  const changeQty = (id, delta) => {
    const line = cart.find((l) => l.id === id);
    if (!line) return;
    const next = line.quantity + delta;
    if (next <= 0) return removeLine(id);
    if (next > line.stock) return toast.error(`Only ${line.stock} in stock`);
    setCart((lines) => lines.map((l) => (l.id === id ? { ...l, quantity: next } : l)));
  };

  // Plays the slide-out animation, then removes the line.
  const removeLine = (id) => {
    setCart((lines) => lines.map((l) => (l.id === id ? { ...l, removing: true } : l)));
    setTimeout(() => setCart((lines) => lines.filter((l) => !(l.id === id && l.removing))), 200);
  };

  const clearCart = () => {
    setCart((lines) => lines.map((l) => ({ ...l, removing: true })));
    setTimeout(() => setCart([]), 200);
  };

  // ---------------- checkout ----------------
  const checkout = async (payment) => {
    const order = await api('/orders', {
      method: 'POST',
      body: {
        customerId: customerId ? Number(customerId) : null,
        items: activeLines.map((l) => ({ productId: l.id, quantity: l.quantity })),
        payment,
      },
    });
    setPayOpen(false);
    setCart([]);
    setCustomerId('');
    setReceipt(order);
    toast.success(`Order ${order.receiptNumber} completed`);
    products.reload();
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
      {/* ================= LEFT: products ================= */}
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-10"
              placeholder="Search menu items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="scroll-thin -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ id: 0, name: 'All' }, ...(categories.data || [])].map((c) => {
            const Icon = c.id ? categoryIcon(c.name) : ShoppingBag;
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95
                  ${active ? 'border-primary bg-primary text-white shadow-md shadow-primary/25' : 'border-line bg-white text-muted hover:border-primary/40 hover:text-ink'}`}
              >
                <Icon size={15} /> {c.name}
              </button>
            );
          })}
        </div>

        {products.error ? (
          <ErrorBox message={products.error} onRetry={products.reload} />
        ) : products.loading && !products.data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="card"><EmptyState icon={Search} title="No items found" message="Try another search or category." /></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
            {visibleProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} flash={flashId === p.id} onAdd={() => addToCart(p)} />
            ))}
          </div>
        )}
      </section>

      {/* ================= RIGHT: cart ================= */}
      <aside className="card flex flex-col xl:sticky xl:top-22 xl:h-[calc(100vh-7rem)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold">Current Order</h2>
            <span key={bump} className={`badge bg-primary text-white ${bump ? 'animate-pop' : ''}`}>{itemCount}</span>
          </div>
          {activeLines.length > 0 && (
            <button className="btn-ghost px-2 py-1 text-xs" onClick={clearCart}>
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        <div className="border-b border-line px-5 py-3">
          <div className="relative">
            <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <select className="input appearance-none pl-10" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {(customers.data || []).map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="scroll-thin min-h-[180px] flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Cart is empty" message="Tap a menu item to add it to the order." />
          ) : (
            <ul>
              {cart.map((line) => (
                <CartLine key={line.id} line={line} onChange={changeQty} onRemove={removeLine} />
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 border-t border-line px-5 py-4 text-sm">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
          <div className="flex justify-between text-muted"><span>VAT (12%)</span><span>{money(totals.vat)}</span></div>
          <div className="flex items-end justify-between pt-1">
            <span className="font-semibold">Total</span>
            <span key={totals.total} className="font-display text-2xl font-bold text-primary animate-fade-in">{money(totals.total)}</span>
          </div>
          <button className="btn-primary mt-2 w-full py-3.5 text-base" disabled={!activeLines.length} onClick={() => setPayOpen(true)}>
            Charge {money(totals.total)}
          </button>
        </div>
      </aside>

      <PaymentModal open={payOpen} total={totals.total} onClose={() => setPayOpen(false)} onPay={checkout} />
      <ReceiptModal open={Boolean(receipt)} order={receipt} onClose={() => setReceipt(null)} title="Payment successful" />
    </div>
  );
}

function ProductCard({ product, index, flash, onAdd }) {
  const Icon = categoryIcon(product.categoryName);
  const out = product.stock <= 0;
  const low = !out && product.stock <= 10;
  return (
    <button
      onClick={onAdd}
      disabled={out}
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-3 text-left animate-rise cursor-pointer
        transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 active:scale-[0.97]
        disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-none
        ${flash ? 'border-primary ring-4 ring-primary/15' : 'border-line hover:border-primary/30'}`}
    >
      <div className="relative mb-3 flex h-20 items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-primary/[0.03]">
        <Icon size={34} className="text-primary transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
        {flash && <span className="absolute h-12 w-12 rounded-full bg-primary/30 animate-ripple" />}
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary opacity-0 shadow transition-all duration-200 group-hover:opacity-100">
          <Plus size={16} />
        </span>
      </div>
      <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{product.name}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-display font-bold text-primary">{money(product.price)}</span>
        {out ? (
          <span className="badge bg-gray-100 text-muted"><PackageX size={12} /> Sold out</span>
        ) : (
          <span className={`text-xs ${low ? 'font-semibold text-amber-600' : 'text-muted'}`}>{product.stock} left</span>
        )}
      </div>
    </button>
  );
}

function CartLine({ line, onChange, onRemove }) {
  const Icon = categoryIcon(line.categoryName);
  return (
    <li className={`flex items-center gap-3 border-b border-line px-5 py-3 last:border-0 ${line.removing ? 'animate-item-out' : 'animate-item-in'}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{line.name}</p>
        <p className="text-xs text-muted">{money(line.price)} each</p>
      </div>
      <div className="flex items-center rounded-lg border border-line">
        <button className="p-1.5 text-muted transition hover:text-primary active:scale-90 cursor-pointer" onClick={() => onChange(line.id, -1)} aria-label="Decrease">
          <Minus size={14} />
        </button>
        <span key={line.quantity} className="w-7 text-center text-sm font-semibold animate-pop">{line.quantity}</span>
        <button className="p-1.5 text-muted transition hover:text-primary active:scale-90 cursor-pointer" onClick={() => onChange(line.id, 1)} aria-label="Increase">
          <Plus size={14} />
        </button>
      </div>
      <div className="w-20 text-right text-sm font-semibold">{money(line.price * line.quantity)}</div>
      <button className="text-muted transition hover:text-primary cursor-pointer" onClick={() => onRemove(line.id)} aria-label="Remove">
        <Trash2 size={15} />
      </button>
    </li>
  );
}

const METHODS = [
  { key: 'CASH', label: 'Cash', icon: Banknote },
  { key: 'GCASH', label: 'GCash', icon: Smartphone },
  { key: 'CARD', label: 'Card', icon: CreditCard },
];

/**
 * Collects the fields for the chosen payment method.
 * The backend turns this into a CashPayment / GCashPayment / CardPayment object.
 */
function PaymentModal({ open, total, onClose, onPay }) {
  const [method, setMethod] = useState('CASH');
  const [cash, setCash] = useState('');
  const [mobile, setMobile] = useState('');
  const [card, setCard] = useState('');
  const [holder, setHolder] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const cashRef = useRef(null);

  const tendered = Number(cash || 0);
  const change = tendered - total;
  const quick = [...new Set([total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000])];

  const reset = () => {
    setCash(''); setMobile(''); setCard(''); setHolder(''); setError(''); setMethod('CASH');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onPay({
        method,
        amountTendered: method === 'CASH' ? cash : null,
        mobileNumber: method === 'GCASH' ? mobile : null,
        cardNumber: method === 'CARD' ? card : null,
        cardHolder: method === 'CARD' ? holder : null,
      });
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const idx = METHODS.findIndex((m) => m.key === method);

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title="Payment">
      <form id="pay-form" onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl bg-page p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Amount due</p>
          <p className="font-display text-3xl font-bold text-primary">{money(total)}</p>
        </div>

        {/* segmented control with a sliding highlight */}
        <div className="relative grid grid-cols-3 rounded-xl bg-page p-1">
          <span
            className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-lg bg-white shadow transition-transform duration-250 ease-out"
            style={{ transform: `translateX(${idx * 100}%)` }}
          />
          {METHODS.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              onClick={() => { setMethod(key); setError(''); }}
              className={`relative z-10 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${method === key ? 'text-primary' : 'text-muted hover:text-ink'}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div key={method} className="animate-fade-in space-y-4">
          {method === 'CASH' && (
            <>
              <label className="block">
                <span className="label">Cash received</span>
                <input ref={cashRef} className="input text-lg font-semibold" type="number" min="0" step="0.01" inputMode="decimal"
                  value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0.00" autoFocus required />
              </label>
              <div className="grid grid-cols-4 gap-2">
                {quick.map((v) => (
                  <button type="button" key={v} className="btn-secondary px-2 py-2 text-xs" onClick={() => setCash(v.toFixed(2))}>
                    {v === total ? 'Exact' : money(v)}
                  </button>
                ))}
              </div>
              <div className={`flex justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${cash && change < 0 ? 'bg-primary/5 text-primary' : 'bg-emerald-50 text-emerald-700'}`}>
                <span>{cash && change < 0 ? 'Short by' : 'Change'}</span>
                <span>{money(Math.abs(cash ? change : 0))}</span>
              </div>
            </>
          )}
          {method === 'GCASH' && (
            <label className="block">
              <span className="label">GCash mobile number</span>
              <input className="input" inputMode="numeric" placeholder="09XXXXXXXXX" maxLength={13}
                value={mobile} onChange={(e) => setMobile(e.target.value)} autoFocus required />
              <span className="mt-1.5 block text-xs text-muted">Simulated: no real GCash transaction is made.</span>
            </label>
          )}
          {method === 'CARD' && (
            <>
              <label className="block">
                <span className="label">Card number</span>
                <input className="input tracking-wider" inputMode="numeric" placeholder="4242 4242 4242 4242" maxLength={19}
                  value={card} onChange={(e) => setCard(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '))} autoFocus required />
              </label>
              <label className="block">
                <span className="label">Card holder</span>
                <input className="input" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Name on card" required />
              </label>
              <p className="text-xs text-muted">Simulated: use test number 4242 4242 4242 4242. Only the last 4 digits are saved.</p>
            </>
          )}
        </div>

        {error && <p className="rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-primary animate-fade-in">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary flex-[2] py-3" disabled={busy || (method === 'CASH' && (!cash || change < 0))}>
            {busy && <Spinner />} {busy ? 'Processing…' : `Complete payment`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
