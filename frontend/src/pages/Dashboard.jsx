import { Banknote, ReceiptText, TrendingUp, Wallet, AlertTriangle, Trophy, RefreshCw } from 'lucide-react';
import { PageHeader, Skeleton, ErrorBox, EmptyState } from '../components/ui';
import { dateTime, money, useApi, PAYMENT_LABELS, PAYMENT_STYLES } from '../utils';

export default function Dashboard({ user }) {
  const { data, loading, error, reload } = useApi('/dashboard');

  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const stats = data && [
    { label: "Today's sales", value: money(data.todaySales), icon: Banknote, tint: 'bg-primary/10 text-primary' },
    { label: "Today's orders", value: data.todayOrders, icon: ReceiptText, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Last 7 days', value: money(data.weekSales), icon: TrendingUp, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Average order', value: money(data.averageOrder), icon: Wallet, tint: 'bg-blue-50 text-blue-600' },
  ];

  const maxDay = data ? Math.max(1, ...data.salesByDay.map((d) => Number(d.sales))) : 1;
  const totalPaid = data ? data.paymentMethods.reduce((s, m) => s + Number(m.amount), 0) || 1 : 1;

  return (
    <div>
      <PageHeader title={`Hello, ${user.firstName.split(' ')[0]}!`} subtitle="Here's how Kenneth Fried Chicken is doing.">
        <button className="btn-secondary" onClick={reload} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin-slow' : ''} /> Refresh
        </button>
      </PageHeader>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {!data
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : stats.map(({ label, value, icon: Icon, tint }, i) => (
              <div key={label} className="card p-5 animate-rise transition hover:-translate-y-0.5 hover:shadow-md" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${tint}`}><Icon size={20} /></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-1 font-display text-xl font-bold sm:text-2xl">{value}</p>
              </div>
            ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* sales chart */}
        <div className="card p-5 lg:col-span-2 animate-rise" style={{ animationDelay: '120ms' }}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display font-semibold">Sales — last 7 days</h3>
            {data && <span className="text-sm text-muted">{data.totalOrders} orders all-time</span>}
          </div>
          {!data ? (
            <Skeleton className="h-56" />
          ) : (
            <div className="flex h-56 items-end gap-2 sm:gap-4">
              {data.salesByDay.map((d, i) => {
                const pct = (Number(d.sales) / maxDay) * 100;
                const isToday = i === data.salesByDay.length - 1;
                return (
                  <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[11px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">
                      {money(d.sales)}
                    </span>
                    <div
                      className={`w-full max-w-12 rounded-t-lg animate-grow-up transition-colors ${isToday ? 'bg-primary' : 'bg-primary/25 group-hover:bg-primary/50'}`}
                      style={{ height: `${Math.max(pct, 2)}%`, animationDelay: `${i * 60}ms` }}
                      title={`${d.orders} orders`}
                    />
                    <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted'}`}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* payment methods */}
        <div className="card p-5 animate-rise" style={{ animationDelay: '180ms' }}>
          <h3 className="mb-5 font-display font-semibold">Payment methods</h3>
          {!data ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="space-y-4">
              {data.paymentMethods.map((m, i) => (
                <div key={m.method}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className={`badge ${PAYMENT_STYLES[m.method]}`}>{PAYMENT_LABELS[m.method]}</span>
                    <span className="text-muted">{m.count} · <span className="font-semibold text-ink">{money(m.amount)}</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-page">
                    <div className="h-full rounded-full bg-primary animate-grow-right" style={{ width: `${(Number(m.amount) / totalPaid) * 100}%`, animationDelay: `${i * 80}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* top products */}
        <div className="card p-5 animate-rise" style={{ animationDelay: '240ms' }}>
          <h3 className="mb-4 flex items-center gap-2 font-display font-semibold"><Trophy size={17} className="text-amber-500" /> Best sellers</h3>
          {!data ? <Skeleton className="h-40" /> : (
            <ol className="space-y-3">
              {data.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-primary text-white' : 'bg-page text-muted'}`}>{i + 1}</span>
                  <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                  <span className="text-sm text-muted">{p.quantity} sold</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* low stock */}
        <div className="card p-5 animate-rise" style={{ animationDelay: '300ms' }}>
          <h3 className="mb-4 flex items-center gap-2 font-display font-semibold"><AlertTriangle size={17} className="text-amber-500" /> Low stock</h3>
          {!data ? <Skeleton className="h-40" /> : data.lowStock.length === 0 ? (
            <EmptyState title="All stocked up" />
          ) : (
            <ul className="space-y-3">
              {data.lowStock.map((p) => (
                <li key={p.productId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className={`badge ${p.quantity === 0 ? 'bg-primary text-white' : 'bg-amber-50 text-amber-700'}`}>
                    {p.quantity} / {p.reorderLevel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* recent orders */}
        <div className="card p-5 animate-rise" style={{ animationDelay: '360ms' }}>
          <h3 className="mb-4 font-display font-semibold">Recent orders</h3>
          {!data ? <Skeleton className="h-40" /> : (
            <ul className="space-y-3">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer}</p>
                    <p className="text-xs text-muted">{dateTime(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{money(o.total)}</p>
                    <span className={`badge ${PAYMENT_STYLES[o.method] || ''}`}>{PAYMENT_LABELS[o.method]}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
