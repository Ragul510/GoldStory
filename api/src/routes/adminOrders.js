// ADMIN ORDER / CUSTOMER / RATE routes (cookie login required):
//   GET   /api/admin/orders
//   PATCH /api/admin/orders/:id/status   { status }   ("Payment Confirmed" is refused: only a verified webhook may set it)
//   GET   /api/admin/artwork/:file       download a customer's uploaded design
//   GET   /api/admin/customers           grouped by mobile number
//   GET   /api/admin/rates
//   PUT   /api/admin/rates               { rate22, rate24, making, tax, shipping }
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { db, ARTWORK_DIR } from '../db.js';
import { requireAdmin } from '../auth.js';
import { ORDER_STATUSES, parseOrder, getRates } from '../lib/models.js';
import { rateSchema } from '../lib/validation.js';

const r = Router(); r.use(requireAdmin);

r.get('/orders', (_req, res) => res.json(db.prepare('select * from orders order by created_at desc').all().map(parseOrder)));
r.patch('/orders/:id/status', (req, res) => {
  if (!ORDER_STATUSES.includes(req.body?.status)) return res.status(400).json({ error: 'Invalid status' });
  if (req.body.status === 'Payment Confirmed') return res.status(400).json({ error: 'Payment Confirmed is set only by the verified payment webhook' });
  const x = db.prepare('update orders set status=? where id=?').run(req.body.status, req.params.id);
  x.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Not found' });
});
r.get('/artwork/:file', (req, res) => {
  const full = path.join(ARTWORK_DIR, path.basename(req.params.file));
  fs.existsSync(full) ? res.set('Content-Disposition', 'attachment').sendFile(full) : res.status(404).json({ error: 'Not found' });
});
r.get('/customers', (_req, res) => res.json(db.prepare(`select json_extract(customer,'$.mobile') mobile, json_extract(customer,'$.name') name,
  json_extract(customer,'$.email') email, json_extract(customer,'$.address') address, count(*) orders, sum(json_extract(pricing,'$.total')) total, max(created_at) lastOrder
  from orders group by mobile order by lastOrder desc`).all()));
r.get('/rates', (_req, res) => res.json(getRates()));
r.put('/rates', (req, res) => {
  const p = rateSchema.safeParse(Object.fromEntries(Object.entries(req.body || {}).map(([k, v]) => [k, Number(v)]))); if (!p.success) return res.status(400).json({ error: 'Invalid rates' });
  const d = p.data; db.prepare("update rates set rate22=?,rate24=?,making=?,tax=?,shipping=?,updated_at=datetime('now') where id=1").run(d.rate22, d.rate24, d.making, d.tax, d.shipping);
  res.json(getRates());
});
export default r;
