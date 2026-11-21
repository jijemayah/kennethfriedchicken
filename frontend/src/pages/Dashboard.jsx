import { Banknote, ReceiptText, TrendingUp, Wallet, AlertTriangle, Trophy, RefreshCw, UserCheck, Undo2 } from 'lucide-react';
import { PageHeader, Skeleton, ErrorBox, EmptyState } from '../components/ui';
import { ReportCard } from '../components/SalesReport';
import { dateTime, timeOnly, money, useApi, PAYMENT_LABELS, PAYMENT_STYLES, ORDER_TYPE_LABELS, STATUS_STYLES } from '../utils';

export default function Dashboard({ user }) {
  const { data, loading, error, reload } = useApi('/dashboard');
  const manager = user.canViewSalesHistory;

  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const stats = !data ? null : manager
    ? [
        { label: "Today's net sales", value: money(data.todaySales), icon: Banknote, tint: 'bg-primary/10 text-primary' },
        { label: "Today's orders", value: data.todayOrders, icon: ReceiptText, tint: 'bg-amber-50 text-amber-600' },
        { label: 'Last 7 days', value: money(data.weekSales), icon: TrendingUp, tint: 'bg-emerald-50 text-emerald-600' },
        { label: 'Average order (7 days)', value: money(data.averageOrder), icon: Wallet, tint: 'bg-blue-50 text-blue-600' },
      ]
    : [
        { label: "Today's net sales", value: money(data.todaySales), icon: Banknote, tint: 'bg-primary/10 text-primary' },
        { label: "Today's orders", value: data.todayOrders, icon: ReceiptText, tint: 'bg-amber-50 text-amber-600' },
        { label: 'My transactions', value: data.myOrders, icon: UserCheck, tint: 'bg-emerald-50 text-emerald-600' },
        { label: 'Voids / refunds today', value: data.todayCancelled, icon: Undo2, tint: 'bg-blue-50 text-blue-600' },
      ];

  const totalPaid = data ? data.paymentMethods.reduce((s, m) => s + Number(m.amount), 0) || 1 : 1;

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.firstName.split(' ')[0]}!`}
        subtitle={manager ? "Here's how Kenneth Fried Chicken is doing." : "Today's numbers. Everything resets at midnight (Philippine time)."}
      >
        <button className="btn-secondary" onClick={reload} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin-slow' : ''} /> Refresh
        </button>
      </PageHeader>

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
        <div className="card p-5 lg:col-span-2 animate-rise" style={{ animationDelay: '120ms' }}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display font-semibold">{manager ? 'Net sales — last 7 days' : 'Sales today by hour'}</h3>
            {data && <span className="text-sm text-muted">{manager ? `${data.totalOrders} orders all-time` : `Average order ${money(data.averageOrder)}`}</span>}
          </div>
          {!data ? <Skeleton className="h-56" /> : manager ? <WeekBars days={data.salesByDay} /> : <HourLine hours={data.salesByHour} />}
        </div>

        <div className="card p-5 animate-rise" style={{ animationDelay: '180ms' }}>
          <h3 className="mb-5 font-display font-semibold">Payment methods{manager ? '' : ' today'}</h3>
          {!data ? (
            <Skeleton className="h-40" />
          ) : data.paymentMethods.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <div className="space-y-4">
              {data.paymentMethods.map((m, i) => (
                <div key={m.method}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className={`badge ${PAYMENT_STYLES[m.method]}`}>{PAYMENT_LABELS[m.method]}</span>
                    <span className="text-muted">{m.count} · <span className="font-semibold text-ink">{money(m.amount)}</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-page">
                    <div className="h-full rounded-full bg-linear-to-r from-primary-dark to-[#F04A50] animate-grow-right" style={{ width: `${(Number(m.amount) / totalPaid) * 100}%`, animationDelay: `${i * 80}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 animate-rise" style={{ animationDelay: '240ms' }}>
          <h3 className="mb-4 flex items-center gap-2 font-display font-semibold"><Trophy size={17} className="text-amber-500" /> Best sellers{manager ? '' : ' today'}</h3>
          {!data ? <Skeleton className="h-40" /> : data.topProducts.length === 0 ? <EmptyState title="Nothing sold yet" /> : (
            <ol className="space-y-3">
              {data.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-primary text-white' : 'bg-page text-muted'}`}>{i + 1}</span>
                  <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                  <span className="text-sm text-muted">{p.quantity} sold</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {manager && (
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
        )}

        <div className="card p-5 animate-rise" style={{ animationDelay: '360ms' }}>
          <h3 className="mb-4 font-display font-semibold">Recent orders{manager ? '' : ' today'}</h3>
          {!data ? <Skeleton className="h-40" /> : data.recentOrders.length === 0 ? <EmptyState title="No orders yet today" /> : (
            <ul className="space-y-3">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer} <span className="text-xs font-normal text-muted">· {ORDER_TYPE_LABELS[o.orderType]}</span></p>
                    <p className="text-xs text-muted">{manager ? dateTime(o.createdAt) : timeOnly(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${o.status !== 'COMPLETED' ? 'text-muted line-through' : ''}`}>{money(o.total)}</p>
                    {o.status === 'COMPLETED'
                      ? <span className={`badge ${PAYMENT_STYLES[o.method] || ''}`}>{PAYMENT_LABELS[o.method]}</span>
                      : <span className={`badge ${STATUS_STYLES[o.status]}`}>{o.status.toLowerCase()}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ReportCard user={user} />
      </div>
    </div>
  );
}

function WeekBars({ days }) {
  const maxDay = Math.max(1, ...days.map((d) => Number(d.sales)));
  return (
    <div className="flex h-56 items-end gap-2 sm:gap-4">
      {days.map((d, i) => {
        const pct = (Math.max(Number(d.sales), 0) / maxDay) * 100;
        const isToday = i === days.length - 1;
        return (
          <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[11px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">{money(d.sales)}</span>
            <div
              className={`w-full max-w-12 rounded-t-lg animate-grow-up transition-colors ${isToday ? 'bg-linear-to-t from-primary-dark to-[#F04A50]' : 'bg-linear-to-t from-primary/30 to-primary/10 group-hover:from-primary/60 group-hover:to-primary/30'}`}
              style={{ height: `${Math.max(pct, 2)}%`, animationDelay: `${i * 60}ms` }}
              title={`${d.orders} orders`}
            />
            <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted'}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HourLine({ hours }) {
  if (!hours.length) return <EmptyState title="No sales yet today" />;
  const W = 640, H = 230, L = 56, R = 14, T = 14, B = 30;
  const max = Math.max(100, ...hours.map((h) => Number(h.sales)));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const x = (i) => L + (hours.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (hours.length - 1));
  const y = (v) => T + (1 - Number(v) / top) * (H - T - B);
  const pts = hours.map((h, i) => [x(i), y(h.sales)]);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - B} L${pts[0][0].toFixed(1)},${H - B} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f);
  const labelEvery = Math.ceil(hours.length / 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label="Sales today by hour">
      <defs>
        <linearGradient id="hour-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#D71920" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#D71920" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#EEEEEE" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#777">{t >= 1000 ? `₱${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : `₱${t}`}</text>
        </g>
      ))}
      <path d={area} fill="url(#hour-fill)" className="animate-fade-in" />
      <path d={line} fill="none" stroke="#D71920" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" className="animate-draw-line" style={{ '--len': 2000 }} />
      {hours.map((h, i) => (
        <g key={h.hour} className="group">
          <circle cx={pts[i][0]} cy={pts[i][1]} r="4.5" fill="#fff" stroke="#D71920" strokeWidth="2.5" className="animate-fade-in" style={{ animationDelay: `${300 + i * 40}ms` }}>
            <title>{`${h.label}: ${money(h.sales)} · ${h.orders} orders`}</title>
          </circle>
          {(i % labelEvery === 0 || i === hours.length - 1) && (
            <text x={pts[i][0]} y={H - 8} textAnchor="middle" fontSize="11" fill="#777">{h.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}
