// ADMIN PRODUCT routes (cookie login required):
//   GET    /api/admin/products               all products incl. pending drafts
//   POST   /api/admin/products               multipart: fields + images[] (max 8) + video
//   PUT    /api/admin/products/:id           multipart: fields, new images appended, removeImages=[filenames], removeVideo=true
//   PATCH  /api/admin/products/:id/status    { status: pending | fulfilled | unfulfilled }
//   DELETE /api/admin/products/:id           also deletes its image/video files
import { Router } from 'express';
import { db, PRODUCT_DIR } from '../db.js';
import { requireAdmin } from '../auth.js';
import { productUpload, sniff, removeFiles, MAX_IMAGE } from '../upload.js';
import { PRODUCT_STATUSES, parseProduct, rawProduct, uniqueSlug } from '../lib/models.js';
import { bodyToProduct, list, zodMessage } from '../lib/validation.js';

const r = Router(); r.use(requireAdmin);

r.get('/', (_req, res) => res.json(db.prepare('select * from products order by id desc').all().map(parseProduct)));

function readUploads(req, res, next) {
  productUpload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Up to 8 images and 1 video' : err.message });
    const imgs = req.files?.images || [], vid = req.files?.video?.[0];
    const all = [...imgs, ...(vid ? [vid] : [])];
    const bad = all.find((f) => !sniff(f) || (f.mimetype.startsWith('image/') && f.size > MAX_IMAGE));
    if (bad) { removeFiles(PRODUCT_DIR, all.map((f) => f.filename)); return res.status(400).json({ error: `Rejected ${bad.originalname}: invalid file or larger than 8 MB` }); }
    req.newImages = imgs.map((f) => f.filename); req.newVideo = vid?.filename || null; next();
  });
}
const cleanup = (req) => removeFiles(PRODUCT_DIR, [...(req.newImages || []), ...(req.newVideo ? [req.newVideo] : [])]);

r.post('/', readUploads, (req, res) => {
  try {
    const d = bodyToProduct(req.body);
    if (req.newImages.length > 8) throw new Error('Up to 8 images');
    if (d.status === 'fulfilled' && !req.newImages.length) throw new Error('Add at least one image before marking a product fulfilled');
    const info = db.prepare('insert into products(slug,name,type,description,purities,weight_g,max_chars,status,is_new,engrave,images,video) values(?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(uniqueSlug(d.name), d.name, d.type, d.description, JSON.stringify(d.purities), d.weight_g, d.max_chars, d.status, d.is_new ? 1 : 0, JSON.stringify(d.engrave), JSON.stringify(req.newImages), req.newVideo);
    res.status(201).json(parseProduct(rawProduct('id=?', info.lastInsertRowid)));
  } catch (e) { cleanup(req); res.status(400).json({ error: zodMessage(e) }); }
});

r.put('/:id', readUploads, (req, res) => {
  try {
    const cur = rawProduct('id=?', req.params.id); if (!cur) throw new Error('Product not found');
    const d = bodyToProduct(req.body);
    const remove = list(req.body.removeImages); const old = JSON.parse(cur.images);
    const images = [...old.filter((f) => !remove.includes(f)), ...req.newImages];
    if (images.length > 8) throw new Error(`Up to 8 images (you have ${images.length})`);
    if (d.status === 'fulfilled' && !images.length) throw new Error('Add at least one image before marking a product fulfilled');
    const dropVideo = req.body.removeVideo === 'true' || !!req.newVideo; const video = req.newVideo || (dropVideo ? null : cur.video);
    db.prepare("update products set slug=?,name=?,type=?,description=?,purities=?,weight_g=?,max_chars=?,status=?,is_new=?,engrave=?,images=?,video=?,updated_at=datetime('now') where id=?")
      .run(uniqueSlug(d.name, cur.id), d.name, d.type, d.description, JSON.stringify(d.purities), d.weight_g, d.max_chars, d.status, d.is_new ? 1 : 0, JSON.stringify(d.engrave), JSON.stringify(images), video, cur.id);
    removeFiles(PRODUCT_DIR, old.filter((f) => remove.includes(f)));
    if (dropVideo && cur.video) removeFiles(PRODUCT_DIR, [cur.video]);
    res.json(parseProduct(rawProduct('id=?', cur.id)));
  } catch (e) { cleanup(req); res.status(400).json({ error: zodMessage(e) }); }
});

r.patch('/:id/status', (req, res) => {
  const s = req.body?.status; if (!PRODUCT_STATUSES.includes(s)) return res.status(400).json({ error: 'Status must be pending, fulfilled or unfulfilled' });
  const cur = rawProduct('id=?', req.params.id); if (!cur) return res.status(404).json({ error: 'Not found' });
  if (s === 'fulfilled' && !JSON.parse(cur.images).length) return res.status(400).json({ error: 'Add an image first' });
  db.prepare("update products set status=?,updated_at=datetime('now') where id=?").run(s, cur.id);
  res.json(parseProduct(rawProduct('id=?', cur.id)));
});

r.delete('/:id', (req, res) => {
  const cur = rawProduct('id=?', req.params.id); if (!cur) return res.status(404).json({ error: 'Not found' });
  db.prepare('delete from products where id=?').run(cur.id);
  removeFiles(PRODUCT_DIR, [...JSON.parse(cur.images), ...(cur.video ? [cur.video] : [])]);
  res.json({ ok: true });
});
export default r;
