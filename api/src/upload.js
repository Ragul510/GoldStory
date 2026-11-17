import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PRODUCT_DIR, ARTWORK_DIR } from './db.js';

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/webm': '.webm' };
export const MAX_IMAGE = 8 * 1024 * 1024, MAX_VIDEO = 60 * 1024 * 1024, MAX_ART = 2 * 1024 * 1024;

const storage = (dir) => multer.diskStorage({
  destination: dir,
  filename: (_req, file, cb) => cb(null, crypto.randomUUID() + (EXT[file.mimetype] || '.bin')),
});
const filter = (allowed) => (_req, file, cb) =>
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Unsupported file type: ' + file.mimetype));

export const productUpload = multer({
  storage: storage(PRODUCT_DIR), limits: { fileSize: MAX_VIDEO, files: 9 },
  fileFilter: filter(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
}).fields([{ name: 'images', maxCount: 8 }, { name: 'video', maxCount: 1 }]);

export const artworkUpload = multer({
  storage: storage(ARTWORK_DIR), limits: { fileSize: MAX_ART, files: 1 },
  fileFilter: filter(['image/jpeg', 'image/png', 'image/webp']),
}).single('file');

/** Check the real file signature, not just the browser-supplied type. */
export function sniff(file) {
  const fd = fs.openSync(file.path, 'r'); const b = Buffer.alloc(16); fs.readSync(fd, b, 0, 16, 0); fs.closeSync(fd);
  const m = file.mimetype;
  if (m === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (m === 'image/png') return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (m === 'image/webp') return b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
  if (m === 'video/mp4') return b.toString('ascii', 4, 8) === 'ftyp';
  if (m === 'video/webm') return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
  return false;
}
export const removeFiles = (dir, names) => names.forEach((n) => { try { fs.unlinkSync(path.join(dir, path.basename(n))); } catch {} });
