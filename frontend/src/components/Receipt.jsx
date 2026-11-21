import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { Modal } from './ui';
import { money, PAYMENT_LABELS, ORDER_TYPE_LABELS, DISCOUNT_LABELS } from '../utils';

const fullTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit',
      })
    : '';

export function Receipt({ order, printedAt }) {
  const p = order.payment;
  const exempt = order.discountType === 'SENIOR' || order.discountType === 'PWD';
  const cancelled = order.status && order.status !== 'COMPLETED';
  return (
    <div className="print-area relative mx-auto w-full max-w-xs overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white p-5 font-mono text-[12.5px] leading-relaxed text-ink">
      {cancelled && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-lg border-4 border-primary/60 px-4 py-1 font-sans text-3xl font-black tracking-widest text-primary/60 animate-stamp">
            {order.status}
          </span>
        </div>
      )}
      <div className="text-center">
        <img src="/logo.png" alt="" className="mx-auto mb-2 h-12 w-12 rounded-full border-2 border-primary object-cover" />
        <p className="font-sans text-sm font-bold">KENNETH FRIED CHICKEN</p>
        <p className="text-muted">Ampogi ko st., Kenneth City, Manila</p>
      </div>

      <div className="my-3 border-t border-dashed border-gray-300" />
      <Row label="Receipt #" value={order.receiptNumber} />
      <Row label="Date/Time" value={fullTime(order.createdAt)} />
      <Row label="Order type" value={order.orderTypeLabel || ORDER_TYPE_LABELS[order.orderType] || 'Dine in'} />
      <Row label="Cashier" value={order.employeeName} />
      {order.employeeNo && <Row label="Employee #" value={order.employeeNo} />}
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
          {Number(item.discount) > 0 && (
            <div className="flex justify-between text-muted"><span>  Less discount</span><span>−{money(item.discount)}</span></div>
          )}
        </div>
      ))}

      <div className="my-3 border-t border-dashed border-gray-300" />
      <Row label="Subtotal" value={money(order.subtotal)} />
      {Number(order.discount) > 0 && (
        <Row label={`Less: ${DISCOUNT_LABELS[order.discountType] || 'Discount'}`} value={`−${money(order.discount)}`} />
      )}
      <Row label="VATable sales" value={money(order.vatableSales)} />
      <Row label="VAT-exempt sales" value={money(order.vatExemptSales)} />
      <Row label={exempt ? 'VAT (exempt)' : 'VAT (12%)'} value={money(order.vat)} />
      <div className="mt-1 flex justify-between text-sm font-bold">
        <span>TOTAL</span>
        <span>{money(order.total)}</span>
      </div>

      {order.discountType && order.discountType !== 'NONE' && (
        <>
          <div className="my-3 border-t border-dashed border-gray-300" />
          <Row label="Discount" value={DISCOUNT_LABELS[order.discountType]} />
          <Row label={order.discountType === 'EMPLOYEE' ? 'Employee #' : 'ID #'} value={order.discountIdNo} />
          {exempt && <Row label="Name" value={order.customerName} />}
          {exempt && <p className="mt-2 text-muted">Signature: ____________________</p>}
        </>
      )}

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

      {cancelled && (
        <>
          <div className="my-3 border-t border-dashed border-gray-300" />
          <Row label={order.status === 'VOIDED' ? 'Voided' : 'Refunded'} value={fullTime(order.cancelledAt)} />
          <Row label="By" value={order.cancelledByName} />
          <Row label="Reason" value={order.cancelReason} />
        </>
      )}

      <div className="my-3 border-t border-dashed border-gray-300" />
      {printedAt && <p className="text-center text-muted">Printed {fullTime(printedAt)}</p>}
      <p className="text-center text-muted">Thank you for dining at KFC!</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function ReceiptModal({ order, open, onClose, title = 'Receipt', extraFooter }) {
  const [printedAt, setPrintedAt] = useState(() => new Date());

  useEffect(() => {
    if (open) setPrintedAt(new Date());
  }, [open, order?.id]);

  const print = () => {
    setPrintedAt(new Date());
    setTimeout(() => window.print(), 50);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          {extraFooter}
          <button className="btn-secondary" onClick={print}>
            <Printer size={16} /> Print
          </button>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </>
      }
    >
      {order && <Receipt order={order} printedAt={printedAt} />}
    </Modal>
  );
}
