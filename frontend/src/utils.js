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

export const today = () => new Date().toLocaleDateString('en-CA');

export function cartTotals(lines) {
  const subtotal = lines.reduce((sum, l) => sum + Math.round(Number(l.price) * 100) * l.quantity, 0);
  const vat = Math.round(subtotal * 0.12);
  return { subtotal: subtotal / 100, vat: vat / 100, total: (subtotal + vat) / 100 };
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
