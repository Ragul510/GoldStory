// ADMIN AUTH routes:
//   POST /api/admin/login      { passcode }            -> sets httpOnly cookie
//   POST /api/admin/logout
//   GET  /api/admin/me                                  -> 200 if logged in, else 401
//   POST /api/admin/passcode   { current, next }       -> change passcode
import { Router } from 'express';
import { checkPasscode, changePasscode, signToken, cookieOpts, requireAdmin } from '../auth.js';
import { limiter } from '../middleware/security.js';

const r = Router();
r.post('/login', limiter(15 * 60 * 1000, 8), (req, res) => {
  if (!checkPasscode(req.body?.passcode)) return res.status(401).json({ error: 'Wrong passcode' });
  res.cookie('gs_admin', signToken(), cookieOpts).json({ ok: true });
});
r.post('/logout', (_req, res) => res.clearCookie('gs_admin', { path: '/' }).json({ ok: true }));
r.get('/me', requireAdmin, (_req, res) => res.json({ ok: true }));
r.post('/passcode', requireAdmin, limiter(15 * 60 * 1000, 8), (req, res) => {
  const { current, next } = req.body || {};
  if (!checkPasscode(current)) return res.status(401).json({ error: 'Current passcode is wrong' });
  if (typeof next !== 'string' || next.length < 8) return res.status(400).json({ error: 'New passcode needs 8+ characters' });
  changePasscode(next); res.json({ ok: true });
});
export default r;
