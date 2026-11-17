// The ONLY place the React app talks to the Node.js backend. Every route is listed here.
// BASE is '' (same origin): in development Vite proxies /api and /uploads to the API (see vite.config.js),
// and in production the Node server serves both the site and the API, so cookies and CORS "just work".
const env = import.meta.env || {};
const BASE = env.VITE_API_URL || '';

/** Returns { ok, status, data } and never throws on HTTP errors. */
async function send(path, { method = 'GET', json, body } = {}) {
  const init = { method, headers: {}, credentials: BASE ? 'include' : 'same-origin' };
  if (json !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(json); }
  else if (body) init.body = body; // FormData (the browser sets the multipart header)
  const res = await fetch(BASE + path, init);
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { ok: res.ok, status: res.status, data };
}
/** Same, but throws Error(message) when the API says no (used by the admin screens). */
async function must(path, opts) {
  const r = await send(path, opts);
  if (!r.ok) throw new Error(r.data?.error || `Request failed (${r.status})`);
  return r.data;
}

/* ---------- public routes ---------- */
export const getProducts = () => must('/api/products');                              // GET  /api/products
export const getProduct = (slug) => must(`/api/products/${encodeURIComponent(slug)}`); // GET  /api/products/:slug
export const getRatesStatus = () => must('/api/rates/public');                        // GET  /api/rates/public
export const getQuote = (slug, purity, engraving = true) => send('/api/quote', { method: 'POST', json: { slug, purity, engraving } }); // POST /api/quote
export const uploadArtwork = (file) => { const fd = new FormData(); fd.append('file', file); return send('/api/artwork', { method: 'POST', body: fd }); }; // POST /api/artwork
export const createOrder = (payload) => send('/api/orders', { method: 'POST', json: payload }); // POST /api/orders

/* ---------- admin routes (need the admin cookie) ---------- */
export const adminMe = async () => (await send('/api/admin/me')).ok;                  // GET  /api/admin/me
export const adminLogin = (passcode) => must('/api/admin/login', { method: 'POST', json: { passcode } });
export const adminLogout = () => must('/api/admin/logout', { method: 'POST' });
export const changePasscode = (current, next) => must('/api/admin/passcode', { method: 'POST', json: { current, next } });
export const adminListProducts = () => must('/api/admin/products');
export const adminSaveProduct = (id, formData) => must(id ? `/api/admin/products/${id}` : '/api/admin/products', { method: id ? 'PUT' : 'POST', body: formData });
export const adminSetProductStatus = (id, status) => must(`/api/admin/products/${id}/status`, { method: 'PATCH', json: { status } });
export const adminDeleteProduct = (id) => must(`/api/admin/products/${id}`, { method: 'DELETE' });
export const adminListOrders = () => must('/api/admin/orders');
export const adminSetOrderStatus = (id, status) => must(`/api/admin/orders/${id}/status`, { method: 'PATCH', json: { status } });
export const adminListCustomers = () => must('/api/admin/customers');
export const adminGetRates = () => must('/api/admin/rates');
export const adminSaveRates = (rates) => must('/api/admin/rates', { method: 'PUT', json: rates });
export const artworkUrl = (file) => `${BASE}/api/admin/artwork/${file}`;
