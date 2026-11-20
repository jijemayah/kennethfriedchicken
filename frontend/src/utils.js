import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import {
  Drumstick, Package, Sandwich, Soup, CupSoda, IceCreamCone, UtensilsCrossed,
} from 'lucide-react';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export const money = (value) => peso.format(Number(value || 0));

export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : '';

export const timeOnly = (value) =>
  value ? new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '';

// Store dates are always Philippine time (UTC+8), whatever the device clock says.
export const storeDate = (value = new Date()) =>
  new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
export const today = () => storeDate();
export const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const ORDER_TYPES = [
  { key: 'DINE_IN', label: 'Dine in' },
  { key: 'TAKE_OUT', label: 'Take out' },
  { key: 'DELIVERY', label: 'Delivery' },
  { key: 'FOOD_APP', label: 'Food delivery app' },
];
export const ORDER_TYPE_LABELS = { ...Object.fromEntries(ORDER_TYPES.map((t) => [t.key, t.label])), DRIVE_THRU: 'Drive-thru' };
export const NEEDS_NAME = ['DELIVERY', 'FOOD_APP'];

export const DISCOUNTS = [
  { key: 'NONE', label: 'None' },
  { key: 'SENIOR', label: 'Senior citizen', idLabel: 'OSCA / Senior citizen ID no.', placeholder: 'OSCA-2019-004521' },
  { key: 'PWD', label: 'PWD', idLabel: 'PWD ID no.', placeholder: 'PWD-RIZ-0042-118' },
  { key: 'EMPLOYEE', label: 'Employee', idLabel: 'Employee no.', placeholder: 'EMP-001' },
];
export const DISCOUNT_LABELS = { SENIOR: 'Senior citizen 20%', PWD: 'PWD 20%', EMPLOYEE: 'Employee 10%' };

export const STATUS_STYLES = {
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  VOIDED: 'bg-gray-100 text-gray-600',
  REFUNDED: 'bg-amber-50 text-amber-700',
};

/**
 * Same rules as the Java Discount classes, in centavos so the screen matches the receipt:
 * VAT is 12% per item after that item's discount. Senior/PWD: VAT-exempt, 20% off up to ₱250 total.
 * Employee: 10% off one unit of the most expensive item.
 */
export function cartTotals(lines, discountType = 'NONE') {
  const exempt = discountType === 'SENIOR' || discountType === 'PWD';
  let capLeft = 25000;
  let priciest = -1;
  lines.forEach((l, i) => {
    if (priciest < 0 || Number(l.price) > Number(lines[priciest].price)) priciest = i;
  });
  let subtotal = 0, discount = 0, vat = 0;
  lines.forEach((l, i) => {
    const unit = Math.round(Number(l.price) * 100);
    const line = unit * l.quantity;
    let off = 0;
    if (exempt) {
      off = Math.min(Math.round((line * 20) / 100), capLeft);
      capLeft -= off;
    } else if (discountType === 'EMPLOYEE' && i === priciest) {
      off = Math.round((unit * 10) / 100);
    }
    subtotal += line;
    discount += off;
    vat += exempt ? 0 : Math.round(((line - off) * 12) / 100);
  });
  return { subtotal: subtotal / 100, discount: discount / 100, vat: vat / 100, total: (subtotal - discount + vat) / 100 };
}

export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError('');
    try {
      setData(await api(path));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

const CATEGORY_ICONS = [
  [/chicken/i, Drumstick],
  [/bucket/i, Package],
  [/burger|sandwich/i, Sandwich],
  [/rice|bowl/i, Soup],
  [/drink/i, CupSoda],
  [/dessert/i, IceCreamCone],
];

export function categoryIcon(name = '') {
  const match = CATEGORY_ICONS.find(([pattern]) => pattern.test(name));
  return match ? match[1] : UtensilsCrossed;
}

export const PAYMENT_LABELS = { CASH: 'Cash', GCASH: 'GCash', CARD: 'Card' };

export const PAYMENT_STYLES = {
  CASH: 'bg-emerald-50 text-emerald-700',
  GCASH: 'bg-blue-50 text-blue-700',
  CARD: 'bg-violet-50 text-violet-700',
};
