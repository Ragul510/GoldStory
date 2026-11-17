// Proves the React app's API layer (src/services/api.js) works against a RUNNING backend with the dummy data.
//   1) cd api && npm run seed:reset && npm start      2) cd web && npm run test:connection
import assert from 'node:assert/strict';

const BASE = process.env.API_URL || 'http://localhost:4000';
const PASSCODE = process.env.API_PASSCODE || 'demo-passcode-123';
const realFetch = globalThis.fetch; let cookie = '';
// The services use relative URLs ("/api/..."), as in the browser. Here we point them at the API and keep the login cookie.
globalThis.fetch = async (url, init = {}) => {
  const r = await realFetch(BASE + url, { ...init, headers: { ...(init.headers || {}), origin: BASE, ...(cookie ? { cookie } : {}) } });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return r;
};
const S = await import('../src/services/api.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('  ok -', name); };
const png = () => new Blob([Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)])], { type: 'image/png' });
const rejects = async (p) => { let failed = false; try { await p; } catch { failed = true; } assert.ok(failed, 'expected the call to be rejected'); };
let before = 0, newId;

await t('GET /api/products: dummy products (draft hidden, bracelet has 8 images)', async () => {
  const list = await S.getProducts(); assert.ok(list.length >= 5);
  assert.ok(!list.some((p) => p.slug === 'gold-chain')); assert.equal(list.find((p) => p.slug === 'gold-bracelet').images.length, 8);
  assert.equal(list.find((p) => p.slug === 'kids-bracelet').status, 'unfulfilled');
});
await t('GET /api/products/:slug: coin has a 360 video', async () => { assert.ok((await S.getProduct('gold-coin')).video); });
await t('GET /api/rates/public: demo rates are set', async () => assert.equal((await S.getRatesStatus()).ready, true));
await t('product image and video files are really served', async () => {
  const p = await S.getProduct('gold-coin');
  assert.match((await realFetch(BASE + p.images[0])).headers.get('content-type'), /image\/jpeg/);
  assert.match((await realFetch(BASE + p.video)).headers.get('content-type'), /video\/mp4/);
});
await t('POST /api/quote: server-calculated estimate; unsupported purity is refused', async () => {
  const a = await S.getQuote('gold-bracelet', '22K'); assert.ok(a.ok && a.data.total > 0 && a.data.weight === 9.3);
  const b = await S.getQuote('gold-ring', '24K'); assert.equal(b.status, 409); assert.equal(b.data.error, 'purity_not_supported');
});
await t('POST /api/orders: valid order accepted, bad mobile rejected', async () => {
  const c = { name: 'Test Buyer', mobile: '9876543210', email: '', address: '10 Test Street, Chennai 600001' };
  const ok = await S.createOrder({ slug: 'gold-ring', purity: '22K', text: 'MK', font: 'Modern', customer: c });
  assert.equal(ok.status, 201); assert.equal(ok.data.paymentStatus, 'unpaid');
  assert.equal((await S.createOrder({ slug: 'gold-ring', purity: '22K', text: 'MK', customer: { ...c, mobile: '123' } })).status, 400);
});
await t('POST /api/artwork: real image accepted, fake image rejected', async () => {
  assert.ok((await S.uploadArtwork(new File([png()], 'logo.png', { type: 'image/png' }))).ok);
  assert.equal((await S.uploadArtwork(new File(['not an image'], 'x.png', { type: 'image/png' }))).status, 400);
});
await t('admin: not logged in at first; wrong passcode rejected; correct passcode logs in', async () => {
  assert.equal(await S.adminMe(), false); await rejects(S.adminLogin('wrong-wrong-1')); await S.adminLogin(PASSCODE); assert.equal(await S.adminMe(), true);
});
await t('admin: lists all 6+ products (including the hidden draft) with images and status', async () => {
  const l = await S.adminListProducts(); before = l.length; assert.ok(l.some((p) => p.slug === 'gold-chain' && p.status === 'pending'));
});
await t('admin: add a product with 2 images, change status, delete it', async () => {
  const fd = new FormData(); Object.entries({ name: 'Connection Test Pendant', type: 'pendant', purities: '22K', weight_g: 3, max_chars: 8, status: 'fulfilled', is_new: 'true', eng_cx: 50, eng_cy: 50, eng_w: 30, eng_h: 8, eng_rot: 0 }).forEach(([k, v]) => fd.append(k, v));
  fd.append('images', png(), 'a.png'); fd.append('images', png(), 'b.png');
  const p = await S.adminSaveProduct(null, fd); newId = p.id; assert.equal(p.images.length, 2);
  assert.equal((await S.adminSetProductStatus(newId, 'unfulfilled')).status, 'unfulfilled');
  await rejects(S.adminSetProductStatus(newId, 'shipped'));
  await S.adminDeleteProduct(newId); assert.equal((await S.adminListProducts()).length, before);
});
await t('admin: orders and customers (demo data + the order placed above)', async () => {
  const o = await S.adminListOrders(); assert.ok(o.length >= 7 && o.some((x) => x.id === 'GS-DEMO1'));
  assert.ok((await S.adminListCustomers()).length >= 5);
  assert.deepEqual(await S.adminSetOrderStatus('GS-DEMO1', 'Design Review'), { ok: true });
  await rejects(S.adminSetOrderStatus('GS-DEMO1', 'Payment Confirmed'));
});
await t('admin: read and save gold rates, and the quote follows them', async () => {
  const r = await S.adminGetRates(); assert.equal(r.rate22, 6000);
  await S.adminSaveRates({ ...r, rate22: 7000 }); assert.equal((await S.getQuote('gold-ring', '22K')).data.rate, 7000);
  await S.adminSaveRates({ ...r, rate22: 6000 });
});
await t('admin: log out', async () => { await S.adminLogout(); assert.equal(await S.adminMe(), false); });
console.log(`\nAll ${n} frontend-to-backend checks passed.`); process.exit(0);
