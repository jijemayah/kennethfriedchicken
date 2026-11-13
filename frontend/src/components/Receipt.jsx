import { Printer } from 'lucide-react';
import { Modal } from './ui';
import { dateTime, money, PAYMENT_LABELS } from '../utils';

export function Receipt({ order }) {
  const p = order.payment;
  return (
    <div className="print-area mx-auto w-full max-w-xs rounded-xl border border-dashed border-gray-300 bg-white p-5 font-mono text-[12.5px] leading-relaxed text-ink">
      <div className="text-center">
        <img src="/logo.png" alt="" className="mx-auto mb-2 h-12 w-12 rounded-full border-2 border-primary object-cover object-top" />
        <p className="font-sans text-sm font-bold">KENNETH FRIED CHICKEN</p>
        <p className="text-muted">Official Receipt (Demo)</p>
      </div>

      <div className="my-3 border-t border-dashed border-gray-300" />
      <Row label="Receipt #" value={order.receiptNumber} />
      <Row label="Date" value={dateTime(order.createdAt)} />
      <Row label="Cashier" value={order.employeeName} />
      <Row label="Customer" value={order.customerName || 'Walk-in'} />
      <div className="my-3 border-t border-dashed border-gray-300" />

      {(order.items || []).map((item) => (
        <div key={item.productId} className="mb-1">
          <div className="flex justify-between gap-2">
            <span className="truncate">{item.productName}</span>
            <span>{money(item.lineTotal)}</span>
          </div>
          <div className="text-muted">
            {item.quantity} x {money(item.unitPrice)}
          </div>
        </div>
      ))}

      <div className="my-3 border-t border-dashed border-gray-300" />
      <Row label="Subtotal" value={money(order.subtotal)} />
      <Row label="VAT (12%)" value={money(order.vat)} />
      <div className="mt-1 flex justify-between text-sm font-bold">
        <span>TOTAL</span>
        <span>{money(order.total)}</span>
      </div>

      {p && (
        <>
          <div className="my-3 border-t border-dashed border-gray-300" />
          <Row label="Paid via" value={PAYMENT_LABELS[p.method]} />
          {p.method !== 'CASH' && <Row label="Account" value={p.details} />}
          <Row label="Amount paid" value={money(p.amountTendered)} />
          {p.method === 'CASH' && <Row label="Change" value={money(p.change)} />}
          <Row label="Ref #" value={p.referenceNumber} />
        </>
      )}

      <div className="my-3 border-t border-dashed border-gray-300" />
      <p className="text-center text-muted">Thank you for dining at KFC!</p>
      <p className="text-center text-[10px] text-muted">This is a student project receipt, not a valid BIR receipt.</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function ReceiptModal({ order, open, onClose, title = 'Receipt', extraFooter }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          {extraFooter}
          <button className="btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </>
      }
    >
      {order && <Receipt order={order} />}
    </Modal>
  );
}
