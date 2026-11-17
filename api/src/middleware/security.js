import rateLimit from 'express-rate-limit';

export const limiter = (windowMs, max) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, try again later.' } });

/** CSRF guard for cookie-authenticated writes: the browser Origin must be one we trust. */
export function originGuard(allowed) {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const o = req.get('origin');
    if (o && !allowed.includes(o)) return res.status(403).json({ error: 'Origin not allowed' });
    next();
  };
}
