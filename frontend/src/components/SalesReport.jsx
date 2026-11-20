import { useState } from 'react';
import { FileBarChart, Printer, CalendarDays, Lock } from 'lucide-react';
import { api } from '../api';
import { Modal, BrandLoader, ErrorBox } from './ui';
import { addDays, money, today, PAYMENT_LABELS, ORDER_TYPE_LABELS } from '../utils';

const PRESETS = [
  { key: 'DAILY', label: 'Daily' },
  { key: 'WEEKLY', label: 'Weekly' },
  { key: 'MONTHLY', label: 'Monthly' },
  { key: 'CUSTOM', label: 'Custom' },
];

function rangeFor(preset, anchor) {
  if (preset === 'DAILY') return { from: anchor, to: anchor };
  if (preset === 'WEEKLY') return { from: addDays(anchor, -6), to: anchor };
  if (preset === 'MONTHLY') {
    const first = `${anchor.slice(0, 7)}-01`;
    const nextMonth = addDays(`${anchor.slice(0, 7)}-28`, 4).slice(0, 7);
    const last = addDays(`${nextMonth}-01`, -1);
    return { from: first, to: last > today() ? today() : last };
  }
  return null;
}

/** Card on the dashboard that opens the EoD / sales report. */
export function ReportCard({ user }) {
  const manager = user.canViewSalesHistory;
  const [preset, setPreset] = useState('DAILY');
  const [anchor, setAnchor] = useState(today());
  const [custom, setCustom] = useState({ from: addDays(today(), -6), to: today() });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const range = !manager ? { from: today(), to: today() } : preset === 'CUSTOM' ? custom : rangeFor(preset, anchor);

  const generate = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    setReport(null);
    try {
      setReport(await api(`/reports/sales?from=${range.from}&to=${range.to}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="card p-5 animate-rise">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display font-semibold"><FileBarChart size={18} className="text-primary" /> End-of-day / sales report</h3>
        {!manager && <span className="badge bg-page text-muted"><Lock size={11} /> Daily only</span>}
      </div>

      {manager ? (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-page p-1">
            {PRESETS.map((p) => (
              <button key={p.key} onClick={() => setPreset(p.key)}
                className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${preset === p.key ? 'bg-white text-primary shadow' : 'text-muted hover:text-ink'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div key={preset} className="animate-fade-in">
            {preset === 'CUSTOM' ? (
              <div className="grid grid-cols-2 gap-2">
                <label><span className="label">From</span><input className="input" type="date" max={custom.to} value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} /></label>
                <label><span className="label">To</span><input className="input" type="date" min={custom.from} max={today()} value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} /></label>
              </div>
            ) : preset === 'MONTHLY' ? (
              <label><span className="label">Month</span><input className="input" type="month" max={today().slice(0, 7)} value={anchor.slice(0, 7)} onChange={(e) => e.target.value && setAnchor(`${e.target.value}-01`)} /></label>
            ) : (
              <label><span className="label">{preset === 'WEEKLY' ? 'Week ending' : 'Date'}</span><input className="input" type="date" max={today()} value={anchor} onChange={(e) => e.target.value && setAnchor(e.target.value)} /></label>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Today's totals for your end-of-day count: sales, voids and refunds, payment types, and items sold.</p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><CalendarDays size={13} /> {range.from === range.to ? range.from : `${range.from} → ${range.to}`}</p>
      <button className="btn-primary mt-3 w-full" onClick={generate} disabled={!range.from || !range.to || range.from > range.to}>
        Generate report
      </button>
    </div>

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title="Sales report"
        footer={<>
          <button className="btn-secondary" onClick={() => window.print()} disabled={!report}><Printer size={16} /> Print</button>
          <button className="btn-primary" onClick={() => setOpen(false)}>Close</button>
        </>}>
        {loading ? <BrandLoader message="Counting today's chicken…" /> : error ? <ErrorBox message={error} onRetry={generate} /> : report && <SalesReport report={report} />}
      </Modal>
    </>
  );
}

export function SalesReport({ report }) {
  const s = report.summary;
  const single = report.from === report.to;
  const generated = new Date(report.generatedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'medium' });
  return (
    <div className="print-area print-wide space-y-5 bg-white text-sm">
      <div className="text-center">
        <p className="font-display text-lg font-bold">KENNETH FRIED CHICKEN</p>
        <p className="font-semibold">{single ? 'End-of-Day Report (Z-reading)' : 'Sales Report'}</p>
        <p className="text-muted">{single ? report.from : `${report.from} to ${report.to}`}</p>
        <p className="text-xs text-muted">Generated {generated} by {report.generatedBy} ({report.generatedByNo})</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Big label="Gross sales" value={money(s.grossSales)} delay={0} />
        <Big label="Less voids & refunds" value={`−${money(s.cancelledAmount)}`} tone="text-primary" delay={60} />
        <Big label="Net sales" value={money(s.netSales)} tone="text-emerald-700" delay={120} />
      </div>

      <Section title="Summary">
        <Line label="Transactions" value={`${s.transactions}${report.scope === 'TODAY' ? ` (yours: ${s.yourTransactions})` : ''}`} />
        <Line label="Receipt numbers" value={s.firstOrderId ? `OR-${String(s.firstOrderId).padStart(6, '0')} to OR-${String(s.lastOrderId).padStart(6, '0')}` : '–'} />
        <Line label="Subtotal (before discount and VAT)" value={money(s.subtotal)} />
        <Line label={`Senior / PWD discount (${s.seniorPwdCount})`} value={`−${money(s.seniorPwdDiscount)}`} />
        <Line label={`Employee discount (${s.employeeDiscountCount})`} value={`−${money(s.employeeDiscount)}`} />
        <Line label="VATable sales" value={money(s.vatableSales)} />
        <Line label="VAT-exempt sales" value={money(s.vatExemptSales)} />
        <Line label="VAT (12%)" value={money(s.vat)} />
        <Line label="Gross sales" value={money(s.grossSales)} bold />
        <Line label={`Voids (${s.voidCount}): money back, stock returned`} value={`−${money(s.voidAmount)}`} />
        <Line label={`Refunds (${s.refundCount}): money back, stock not returned`} value={`−${money(s.refundAmount)}`} />
        <Line label="Net sales" value={money(s.netSales)} bold />
      </Section>

      <div className="grid gap-5 md:grid-cols-2">
        <Breakdown title="By payment method" rows={report.paymentMethods} name={(r) => PAYMENT_LABELS[r.method]} />
        <Breakdown title="By order type" rows={report.orderTypes} name={(r) => ORDER_TYPE_LABELS[r.orderType]} />
      </div>
      {report.paymentMethods.some((r) => r.method === 'CASH') && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
          Expected cash in drawer: <b>{money(report.paymentMethods.find((r) => r.method === 'CASH').net)}</b> (cash sales minus cash voids/refunds)
        </p>
      )}

      {report.cashiers && (
        <Section title="By cashier">
          <Table head={['Employee #', 'Name', 'Orders', 'Gross', 'Cut', 'Net']}
            rows={report.cashiers.map((c) => [c.employeeNo, c.name, c.count, money(c.gross), money(c.cancelled), money(c.net)])} />
        </Section>
      )}

      {!single && report.days.length > 0 && (
        <Section title="By day">
          <Table head={['Date', 'Orders', 'Gross', 'Cut', 'Net']}
            rows={report.days.map((d) => [d.date, d.orders, money(d.gross), money(d.cancelled), money(d.net)])} />
        </Section>
      )}

      <Section title="Inventory touched">
        {report.inventory.length === 0 ? <p className="text-muted">No items sold.</p> : (
          <Table head={['Item', 'Sold', 'Returned (void)', 'Stock now']}
            rows={report.inventory.map((i) => [
              i.name, i.sold, i.returned,
              <span key="s" className={i.lowStock ? 'font-bold text-primary' : ''}>{i.stockNow}{i.lowStock ? ' (low)' : ''}</span>,
            ])} />
        )}
      </Section>

      <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs text-muted">
        <div className="border-t border-gray-300 pt-1">Prepared by ({report.generatedByNo})</div>
        <div className="border-t border-gray-300 pt-1">Checked by (manager)</div>
      </div>
    </div>
  );
}

function Big({ label, value, tone = '', delay }) {
  return (
    <div className="rounded-2xl bg-page p-3 text-center animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`whitespace-nowrap font-display text-base font-bold sm:text-lg ${tone}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="mb-2 border-b border-line pb-1 font-display font-semibold">{title}</h4>
      {children}
    </div>
  );
}

function Line({ label, value, bold }) {
  return (
    <div className={`flex justify-between gap-3 py-0.5 ${bold ? 'font-bold' : ''}`}>
      <span className={bold ? '' : 'text-muted'}>{label}</span><span>{value}</span>
    </div>
  );
}

function Breakdown({ title, rows, name }) {
  return (
    <Section title={title}>
      <Table head={['', 'Count', 'Gross', 'Cut', 'Net']}
        rows={rows.map((r) => [name(r), r.count, money(r.gross), money(r.cancelled), money(r.net)])} />
    </Section>
  );
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr>{head.map((h, i) => <th key={i} className={`py-1 font-semibold text-muted ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => <td key={j} className={`py-1 ${j ? 'text-right' : ''}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
