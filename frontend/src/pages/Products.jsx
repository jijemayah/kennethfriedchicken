import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Tags, UtensilsCrossed } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { Modal, ConfirmModal, PageHeader, TableSkeleton, EmptyState, ErrorBox, Field, Spinner } from '../components/ui';
import { categoryIcon, money, useApi } from '../utils';

export default function Products() {
  const [tab, setTab] = useState('products');
  const categories = useApi('/categories');

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage the menu and its categories." />
      <div className="mb-5 inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-line">
        {[
          ['products', 'Menu items', UtensilsCrossed],
          ['categories', 'Categories', Tags],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer
              ${tab === key ? 'bg-primary text-white shadow' : 'text-muted hover:text-ink'}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      <div key={tab} className="animate-fade-in">
        {tab === 'products' ? <ProductList categories={categories} /> : <CategoryList categories={categories} />}
      </div>
    </div>
  );
}

// =====================================================================
const EMPTY_PRODUCT = { name: '', categoryId: '', price: '', description: '', stock: '0', active: true };

function ProductList({ categories }) {
  const toast = useToast();
  const products = useApi('/products?all=true');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null); // product object or EMPTY_PRODUCT
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const text = search.toLowerCase();
    return (products.data || []).filter(
      (p) => (!filter || p.categoryId === Number(filter)) && p.name.toLowerCase().includes(text),
    );
  }, [products.data, search, filter]);

  const save = async (form) => {
    const body = { ...form, categoryId: Number(form.categoryId), stock: Number(form.stock || 0) };
    if (form.id) {
      await api(`/products/${form.id}`, { method: 'PUT', body });
      if (body.stock !== editing.stock) {
        await api(`/inventory/${form.id}`, { method: 'PUT', body: { quantity: body.stock } });
      }
      toast.success('Product updated');
    } else {
      await api('/products', { method: 'POST', body });
      toast.success('Product added');
    }
    setEditing(null);
    products.reload();
    categories.reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await api(`/products/${deleting.id}`, { method: 'DELETE' });
      toast.success(res.message);
      setDeleting(null);
      products.reload();
      categories.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-10" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-52" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All categories</option>
          {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setEditing({ ...EMPTY_PRODUCT })}>
          <Plus size={16} /> Add product
        </button>
      </div>

      {products.error ? (
        <div className="p-4"><ErrorBox message={products.error} onRetry={products.reload} /></div>
      ) : products.loading && !products.data ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="No products" message="Add your first menu item." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-page/60">
              <tr><th className="th">Product</th><th className="th">Category</th><th className="th text-right">Price</th><th className="th text-right">Stock</th><th className="th">Status</th><th className="th" /></tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                const Icon = categoryIcon(p.categoryName);
                return (
                  <tr key={p.id} className="border-t border-line transition-colors hover:bg-page/60 animate-fade-in" style={{ animationDelay: `${Math.min(i, 15) * 15}ms` }}>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={17} /></span>
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="max-w-xs truncate text-xs text-muted">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td text-muted">{p.categoryName}</td>
                    <td className="td text-right font-semibold">{money(p.price)}</td>
                    <td className="td text-right">{p.stock}</td>
                    <td className="td">
                      <span className={`badge ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-muted'}`}>{p.active ? 'Active' : 'Hidden'}</span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost p-2" onClick={() => setEditing(p)} aria-label="Edit"><Pencil size={15} /></button>
                        <button className="btn-ghost p-2 hover:text-primary" onClick={() => setDeleting(p)} aria-label="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProductForm product={editing} categories={categories.data || []} onClose={() => setEditing(null)} onSave={save} />
      <ConfirmModal
        open={Boolean(deleting)}
        title="Delete product?"
        message={`"${deleting?.name}" will be deleted. If it appears in past orders it will be hidden from the POS instead.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastProduct, setLastProduct] = useState(null);

  // reset the form whenever a different product is opened
  if (product && product !== lastProduct) {
    setLastProduct(product);
    setForm({ ...EMPTY_PRODUCT, ...product, categoryId: product.categoryId || '', price: product.price ?? '', description: product.description || '' });
    setError('');
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={form.id ? 'Edit product' : 'Add product'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" form="product-form" disabled={busy}>{busy && <Spinner />} Save</button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Name"><input className="input" value={form.name} onChange={set('name')} required maxLength={100} /></Field></div>
        <Field label="Category">
          <select className="input" value={form.categoryId} onChange={set('categoryId')} required>
            <option value="" disabled>Select…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Price (₱)"><input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required /></Field>
        <div className="sm:col-span-2"><Field label="Description"><textarea className="input min-h-20" value={form.description} onChange={set('description')} maxLength={255} /></Field></div>
        <Field label={form.id ? 'Stock on hand' : 'Starting stock'}>
          <input className="input" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} required />
        </Field>
        <label className="flex items-center gap-3 self-end py-2.5 text-sm font-medium cursor-pointer">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.active} onChange={set('active')} />
          Show on POS
        </label>
        {error && <p className="sm:col-span-2 rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-primary animate-fade-in">{error}</p>}
      </form>
    </Modal>
  );
}

// =====================================================================
function CategoryList({ categories }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = (c) => {
    setEditing(c);
    setForm({ name: c.name || '', description: c.description || '' });
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing.id) await api(`/categories/${editing.id}`, { method: 'PUT', body: form });
      else await api('/categories', { method: 'POST', body: form });
      toast.success(editing.id ? 'Category updated' : 'Category added');
      setEditing(null);
      categories.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/categories/${deleting.id}`, { method: 'DELETE' });
      toast.success('Category deleted');
      setDeleting(null);
      categories.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => open({})}><Plus size={16} /> Add category</button>
      </div>
      {categories.loading && !categories.data ? (
        <div className="card"><TableSkeleton rows={4} cols={3} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(categories.data || []).map((c, i) => {
            const Icon = categoryIcon(c.name);
            return (
              <div key={c.id} className="card group flex items-start gap-4 p-5 animate-rise transition hover:-translate-y-0.5 hover:shadow-md" style={{ animationDelay: `${i * 40}ms` }}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="truncate text-sm text-muted">{c.description || 'No description'}</p>
                  <p className="mt-2 text-xs font-semibold text-muted">{c.productCount} active products</p>
                </div>
                <div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button className="btn-ghost p-2" onClick={() => open(c)} aria-label="Edit"><Pencil size={15} /></button>
                  <button className="btn-ghost p-2 hover:text-primary" onClick={() => setDeleting(c)} aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit category' : 'Add category'}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" form="category-form" disabled={busy}>{busy && <Spinner />} Save</button>
          </>
        }
      >
        <form id="category-form" onSubmit={save} className="space-y-4">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={60} /></Field>
          <Field label="Description"><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={255} /></Field>
          {error && <p className="rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-primary">{error}</p>}
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(deleting)}
        title="Delete category?"
        message={`"${deleting?.name}" can only be deleted when it has no products.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
