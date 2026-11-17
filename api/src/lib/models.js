// Shared helpers: database row <-> API object, constants, and slugs.
import { db } from '../db.js';

export const PRODUCT_STATUSES = ['pending', 'fulfilled', 'unfulfilled'];
export const ORDER_STATUSES = ['Pending', 'Payment Confirmed', 'Design Review', 'In Production', 'Shipped', 'Delivered', 'Cancelled'];
export const FONTS = ['Classic', 'Script', 'Modern', 'Serif'];

export const parseProduct = (r) => r && ({
  id: r.id, slug: r.slug, name: r.name, type: r.type, description: r.description,
  purities: JSON.parse(r.purities), weightG: r.weight_g, maxChars: r.max_chars,
  status: r.status, isNew: !!r.is_new, engrave: JSON.parse(r.engrave),
  images: JSON.parse(r.images).map((f) => `/uploads/products/${f}`),
  video: r.video ? `/uploads/products/${r.video}` : null,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
export const parseOrder = (r) => ({
  id: r.id, productId: r.product_id, productName: r.product_name, purity: r.purity, text: r.engraving_text, font: r.font,
  artworkFile: r.artwork_file, weightG: r.weight_g, rateUsed: r.rate_used, pricing: JSON.parse(r.pricing), customer: JSON.parse(r.customer),
  paymentStatus: r.payment_status, paymentRef: r.payment_ref, status: r.status, createdAt: r.created_at,
});
export const getRates = () => db.prepare('select * from rates where id=1').get();
export const rawProduct = (where, v) => db.prepare(`select * from products where ${where}`).get(v);

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'product';
export function uniqueSlug(name, ignoreId = 0) {
  const base = slugify(name); let s = base, i = 2;
  while (db.prepare('select 1 from products where slug=? and id<>?').get(s, ignoreId)) s = `${base}-${i++}`;
  return s;
}
