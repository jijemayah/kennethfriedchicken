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

export const ORDER_STATUSES = [
  { key: 'PREPARING', label: 'Preparing', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  { key: 'READY', label: 'Ready', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  { key: 'COMPLETED', label: 'Completed', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
];
export const ORDER_STATUS_LABELS = Object.fromEntries(ORDER_STATUSES.map((s) => [s.key, s.label]));

export const minutesAgo = (value) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hr ${mins % 60} min ago`;
};

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
