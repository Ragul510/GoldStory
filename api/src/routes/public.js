// PUBLIC routes: anyone can call these.
//   GET  /api/health
//   GET  /api/products             live + "coming soon" products
//   GET  /api/products/:slug       one product
//   GET  /api/rates/public         { ready } (are gold rates set?)
//   POST /api/quote                price estimate (server-calculated)
//   POST /api/artwork              upload a customer logo (private)
//   POST /api/orders               place an order (price recalculated on the server)
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { db, ARTWORK_DIR } from '../db.js';
import { buildQuote } from '../pricing.js';
import { artworkUpload, sniff, removeFiles } from '../upload.js';
import { limiter } from '../middleware/security.js';
import { parseProduct, rawProduct, getRates } from '../lib/models.js';
import { quoteSchema, orderSchema } from '../lib/validation.js';

const r = Router();
r.get('/health', (_req, res) => res.json({ ok: true }));

// pending = draft (hidden) | fulfilled = live and orderable | unfulfilled = shown as "Coming soon"
r.get('/products', (_req, res) => {
  const rows = db.prepare("select * from products where status in ('fulfilled','unfulfilled') order by id").all();
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120').json(rows.map(parseProduct));
});
r.get('/products/:slug', (req, res) => {
  const p = parseProduct(rawProduct("slug=? and status in ('fulfilled','unfulfilled')", req.params.slug));
  p ? res.json(p) : res.status(404).json({ error: 'Not found' });
});
r.get('/rates/public', (_req, res) => { const x = getRates(); res.json({ ready: x.rate22 > 0 || x.rate24 > 0, updatedAt: x.updated_at }); });

r.post('/quote', limiter(60 * 1000, 60), (req, res) => {
  const q = quoteSchema.safeParse(req.body); if (!q.success) return res.status(400).json({ error: 'Invalid request' });
  const p = parseProduct(rawProduct("slug=? and status='fulfilled'", q.data.slug)); if (!p) return res.status(404).json({ error: 'Product not available' });
  const out = buildQuote(p, q.data.purity, q.data.engraving, getRates());
  out.error ? res.status(409).json(out) : res.json(out);
});

r.post('/artwork', limiter(60 * 60 * 1000, 20), (req, res) => {
  artworkUpload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file' });
    if (!sniff(req.file)) { removeFiles(ARTWORK_DIR, [req.file.filename]); return res.status(400).json({ error: 'File content does not match its type' }); }
    res.json({ file: req.file.filename });
  });
});

r.post('/orders', limiter(60 * 60 * 1000, 10), (req, res) => {
  const o = orderSchema.safeParse(req.body);
  if (!o.success) return res.status(400).json({ error: 'Invalid order details', issues: o.error.issues.map((i) => i.path.join('.') + ': ' + i.message) });
  const d = o.data;
  const p = parseProduct(rawProduct("slug=? and status='fulfilled'", d.slug)); if (!p) return res.status(404).json({ error: 'Product not available' });
  if (!d.text && !d.artworkFile) return res.status(400).json({ error: 'Add a name or upload a design' });
  if (d.text.length > p.maxChars) return res.status(400).json({ error: `Maximum ${p.maxChars} characters for this piece` });
  if (d.artworkFile && !fs.existsSync(path.join(ARTWORK_DIR, d.artworkFile))) return res.status(400).json({ error: 'Uploaded design not found' });
  const q = buildQuote(p, d.purity, true, getRates());
  if (q.error) return res.status(409).json(q);
  const id = 'GS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  db.prepare('insert into orders(id,product_id,product_name,purity,engraving_text,font,artwork_file,weight_g,rate_used,pricing,customer) values(?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, p.id, p.name, d.purity, d.text || null, d.font, d.artworkFile || null, q.weight, q.rate, JSON.stringify(q), JSON.stringify(d.customer));
  // payment_status stays 'unpaid': a gateway webhook (Razorpay/Cashfree) must confirm it server-side.
  res.status(201).json({ id, status: 'Pending', paymentStatus: 'unpaid', pricing: q, note: 'Payment gateway not connected: this order is recorded as unpaid.' });
});
export default r;
