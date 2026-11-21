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
import { db } from '../db.js';
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


// GET /api/admin/rates
r.get('/rates', (_req, res) => {
    try {
        const rates = getRates();

        if (!rates) {
            return res.status(500).json({
                error: 'Rates not found',
            });
        }

        res.json({
            rate24: Number(rates.rate24 || 0),
            rate22: Number(rates.rate22 || 0),
            rate18: Number(rates.rate18 || 0),
            making: Number(rates.making || 0),
            tax: Number(rates.tax || 0),
            shipping: Number(rates.shipping || 0),
            updated_at: rates.updated_at,
        });
    } catch (error) {
        console.error('Get rates error:', error);

        res.status(500).json({
            error: 'Failed to fetch rates',
        });
    }
});


// PUT /api/admin/rates
r.put('/rates', (req, res) => {
    try {
        const body = req.body || {};

        const normalized = {
            rate24: Number(body.rate24),
            rate22: Number(body.rate22),
            rate18: Number(body.rate18),
            making: Number(body.making),
            tax: Number(body.tax),
            shipping: Number(body.shipping),
        };

        const parsed = rateSchema.safeParse(normalized);

        if (!parsed.success) {
            console.error(
                'Rate validation error:',
                parsed.error.flatten()
            );

            return res.status(400).json({
                error: 'Invalid rates',
                details: parsed.error.flatten(),
            });
        }

        const d = parsed.data;

        db.prepare(`
      UPDATE rates
      SET
        rate24 = ?,
        rate22 = ?,
        rate18 = ?,
        making = ?,
        tax = ?,
        shipping = ?,
        updated_at = datetime('now')
      WHERE id = 1
    `).run(
            d.rate24,
            d.rate22,
            d.rate18,
            d.making,
            d.tax,
            d.shipping
        );

        const savedRates = getRates();

        res.json({
            rate24: Number(savedRates.rate24),
            rate22: Number(savedRates.rate22),
            rate18: Number(savedRates.rate18),
            making: Number(savedRates.making),
            tax: Number(savedRates.tax),
            shipping: Number(savedRates.shipping),
            updated_at: savedRates.updated_at,
        });

    } catch (error) {
        console.error('Save rates error:', error);

        res.status(500).json({
            error: 'Failed to save rates',
            details: error.message,
        });
    }
});


export default r;
