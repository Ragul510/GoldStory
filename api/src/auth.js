import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db } from './db.js';

const prod = process.env.NODE_ENV === 'production';
if (prod && !process.env.JWT_SECRET) { console.error('JWT_SECRET is required in production'); process.exit(1); }
const secret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const get = (k) => db.prepare('select value from settings where key=?').get(k)?.value;
const set = (k, v) => db.prepare('insert into settings(key,value) values(?,?) on conflict(key) do update set value=excluded.value').run(k, v);

/** First start: hash ADMIN_PASSCODE from the environment and store only the hash. */
export function initPasscode() {
  if (get('passcode_hash')) return;
  const p = process.env.ADMIN_PASSCODE || '';
  if (p.length < 8) { console.error('Set ADMIN_PASSCODE (8+ characters) in .env for the first start.'); process.exit(1); }
  set('passcode_hash', bcrypt.hashSync(p, 12));
}
export const checkPasscode = (p) => bcrypt.compareSync(String(p || ''), get('passcode_hash'));
export const changePasscode = (n) => set('passcode_hash', bcrypt.hashSync(n, 12));
export const signToken = () => jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h' });
export const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: prod, maxAge: 8 * 3600 * 1000, path: '/' };

export function requireAdmin(req, res, next) {
  try {
    const t = req.cookies?.gs_admin;
    if (!t || jwt.verify(t, secret).role !== 'admin') throw new Error('x');
    next();
  } catch { res.status(401).json({ error: 'Not logged in' }); }
}
