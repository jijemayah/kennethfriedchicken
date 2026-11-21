import { useState } from 'react';
import { categoryIcon } from '../utils';

const IMAGES = [
  [/1-pc kenneth original/i, '1pc-kenneth-original.jpg'],
  [/2-pc kenneth original/i, '2pc-kenneth-original.jpg'],
  [/1-pc hot kenneth/i, '1pc-hot-kenneth.jpg'],
  [/2-pc hot kenneth/i, '2pc-hot-kenneth.jpg'],
  [/tenders/i, '3pc-kenneth-tenders.jpg'],
  [/bucket/i, 'bucket.jpg'],
  [/zinger/i, 'zinger-burger.jpg'],
  [/sandwich/i, 'sandwich-kenneth.jpg'],
  [/wrap/i, 'drueco-wrap.jpg'],
  [/ala king/i, 'ala-king-bowl.jpg'],
  [/popcorn/i, 'spicy-popcorn-bowl.jpg'],
  [/teriyaki/i, 'teriyaki-bowl.jpg'],
  [/fries/i, 'fries.jpg'],
  [/mashed potato/i, 'mashed-potato.jpg'],
  [/coleslaw/i, 'coleslaw.jpg'],
  [/rice$/i, 'rice.jpg'],
  [/iced tea/i, 'iced-tea.jpg'],
  [/coke/i, 'coke.jpg'],
  [/coffee/i, 'coffee.jpg'],
  [/sundae/i, 'sundae.jpg'],
  [/mango float/i, 'mango-float.jpg'],
  [/egg pie/i, 'egg-pie.jpg'],
];

export function productImage(product) {
  if (product.imageUrl) return product.imageUrl;
  const match = IMAGES.find(([pattern]) => pattern.test(product.name || ''));
  return match ? `/products/${match[1]}` : null;
}

export default function ProductImage({ product, className = '', iconSize = 18 }) {
  const [broken, setBroken] = useState(false);
  const src = productImage(product);
  if (src && !broken) {
    return <img src={src} alt={product.name} loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />;
  }
  const Icon = categoryIcon(product.categoryName);
  return (
    <span className={`flex items-center justify-center bg-primary/10 text-primary ${className}`}>
      <Icon size={iconSize} />
    </span>
  );
}
