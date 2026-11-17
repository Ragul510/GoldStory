// Fills the database with DUMMY data so you can see the whole site working.
//   npm run seed         add dummy data (only if there are no products yet)
//   npm run seed:reset   delete ALL products, orders and uploaded files, then add the dummy data again
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db, PRODUCT_DIR, ARTWORK_DIR } from './db.js';
import { buildQuote } from './pricing.js';
import { parseProduct, rawProduct, getRates, uniqueSlug } from './lib/models.js';

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed-assets', 'dummy');
const reset = process.argv.includes('--reset');
if (reset) {
  db.exec('delete from orders; delete from products;');
  for (const d of [PRODUCT_DIR, ARTWORK_DIR]) for (const f of fs.readdirSync(d)) fs.unlinkSync(path.join(d, f));
  console.log('Reset: removed all products, orders and uploaded files.');
} else if (db.prepare('select count(*) n from products').get().n) {
  console.log('Products already exist, skipping. Use "npm run seed:reset" to start over.'); process.exit(0);
}

const copy = (f) => { const ext = path.extname(f), n = crypto.randomUUID() + ext; fs.copyFileSync(path.join(assets, f), path.join(PRODUCT_DIR, n)); return n; };
const eng = (cx, cy, w, h, rot = 0) => ({ cx, cy, w, h, rot });
const range = (p, n) => Array.from({ length: n }, (_, i) => `${p}-${i + 1}.jpg`);

const PRODUCTS = [
  { name: 'Gold Bracelet', type: 'bracelet', purities: ['22K', '24K'], weight_g: 9, max_chars: 12, status: 'fulfilled', is_new: 1, images: range('bracelet', 8), video: 'bracelet-spin.mp4',
    description: 'DUMMY: a curb-link gold bracelet with a polished name plate, made to order.', engrave: eng(50, 58.75, 26.9, 7.75) },
  { name: 'Gold Ring', type: 'ring', purities: ['22K'], weight_g: 4.5, max_chars: 8, status: 'fulfilled', is_new: 1, images: range('ring', 4), video: null,
    description: 'DUMMY: a flat-top gold ring engraved with your initials or name, made to order.', engrave: eng(49.5, 46.6, 22.9, 4.6, -22.8) },
  { name: 'Gold Coin', type: 'coin', purities: ['22K', '24K'], weight_g: 5, max_chars: 14, status: 'fulfilled', is_new: 1, images: range('coin', 3), video: 'coin-spin.mp4',
    description: 'DUMMY: a personalized gold coin. The weight is a placeholder.', engrave: eng(50, 52, 36, 9) },
  { name: 'Name Pendant', type: 'pendant', purities: ['22K'], weight_g: 3, max_chars: 8, status: 'fulfilled', is_new: 0, images: range('pendant', 3), video: null,
    description: 'DUMMY: a name pendant with placeholder images.', engrave: eng(50, 56, 30, 9) },
  { name: 'Kids Bracelet', type: 'bracelet', purities: ['22K'], weight_g: 4, max_chars: 8, status: 'unfulfilled', is_new: 1, images: ['kids-1.jpg'], video: null,
    description: 'DUMMY: shown as "Coming soon".', engrave: eng(50, 55, 30, 8) },
  { name: 'Gold Chain', type: 'other', purities: ['22K', '24K'], weight_g: 12, max_chars: 6, status: 'pending', is_new: 0, images: ['chain-1.jpg'], video: null,
    description: 'DUMMY: a hidden draft (status pending), visible only in the admin.', engrave: eng(50, 55, 30, 8) },
];
for (const p of PRODUCTS) {
  db.prepare('insert into products(slug,name,type,description,purities,weight_g,max_chars,status,is_new,engrave,images,video) values(?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(uniqueSlug(p.name), p.name, p.type, p.description, JSON.stringify(p.purities), p.weight_g, p.max_chars, p.status, p.is_new, JSON.stringify(p.engrave), JSON.stringify(p.images.map(copy)), p.video ? copy(p.video) : null);
}

// DEMO rates so estimates show up. These are NOT real market prices: set your own in Admin > Edit rates.
db.prepare("update rates set rate22=6000, rate24=6500, making=10, personalization=500, tax=3, shipping=100, updated_at=datetime('now') where id=1").run();

const ORDERS = [
  ['gold-bracelet', '22K', 'Aarav', 'Script', 'Demo Customer A', '9000000001', 'Demo address A, 1 Demo Street, Chennai 600001', 'Pending', 0],
  ['gold-ring', '22K', 'MK', 'Modern', 'Demo Customer B', '9000000002', 'Demo address B, 2 Demo Street, Mumbai 400001', 'Design Review', 1],
  ['gold-coin', '24K', 'Riya', 'Classic', 'Demo Customer C', '9000000003', 'Demo address C, 3 Demo Street, Bengaluru 560001', 'In Production', 2],
  ['gold-bracelet', '24K', 'Dev', 'Serif', 'Demo Customer A', '9000000001', 'Demo address A, 1 Demo Street, Chennai 600001', 'Shipped', 4],
  ['name-pendant', '22K', 'Anya', 'Script', 'Demo Customer D', '9000000004', 'Demo address D, 4 Demo Street, Delhi 110001', 'Delivered', 8],
  ['gold-ring', '22K', 'SR', 'Classic', 'Demo Customer E', '9000000005', 'Demo address E, 5 Demo Street, Hyderabad 500001', 'Cancelled', 10],
];
ORDERS.forEach(([slug, purity, text, font, name, mobile, address, status, daysAgo], i) => {
  const p = parseProduct(rawProduct('slug=?', slug)); const q = buildQuote(p, purity, true, getRates());
  db.prepare("insert into orders(id,product_id,product_name,purity,engraving_text,font,weight_g,rate_used,pricing,customer,status,created_at) values(?,?,?,?,?,?,?,?,?,?,?,datetime('now',?))")
    .run(`GS-DEMO${i + 1}`, p.id, p.name, purity, text, font, q.weight, q.rate, JSON.stringify(q), JSON.stringify({ name, mobile, email: '', address }), status, `-${daysAgo} days`);
});
console.log(`Dummy data added: ${PRODUCTS.length} products (one with 8 images, two with a 360 video), ${ORDERS.length} orders, 5 customers, DEMO gold rates.`);
