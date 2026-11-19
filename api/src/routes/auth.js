import { Router } from 'express';
import {
    checkPasscode,
    changePasscode,
    signToken,
    cookieOpts,
    requireAdmin,
} from '../auth.js';
import { limiter } from '../middleware/security.js';

const r = Router();

// Cookie configuration for production frontend (Vercel)
// and backend (Render), which are cross-origin.
const adminCookieOpts = {
    ...cookieOpts,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
};

// --------------------------------------------------
// ADMIN LOGIN
// --------------------------------------------------
r.post('/login', limiter(15 * 60 * 1000, 8), (req, res) => {
    const passcode = req.body?.passcode;

    if (!checkPasscode(passcode)) {
        return res.status(401).json({
            error: 'Wrong passcode',
        });
    }

    const token = signToken();

    res.cookie('gs_admin', token, adminCookieOpts);

    return res.json({
        ok: true,
    });
});

// --------------------------------------------------
// ADMIN LOGOUT
// --------------------------------------------------
r.post('/logout', (_req, res) => {
    res.clearCookie('gs_admin', adminCookieOpts);

    return res.json({
        ok: true,
    });
});

// --------------------------------------------------
// CHECK ADMIN AUTHENTICATION
// --------------------------------------------------
r.get('/me', requireAdmin, (_req, res) => {
    return res.json({
        ok: true,
    });
});

// --------------------------------------------------
// CHANGE ADMIN PASSCODE
// --------------------------------------------------
r.post(
    '/passcode',
    requireAdmin,
    limiter(15 * 60 * 1000, 8),
    (req, res) => {
        const { current, next } = req.body || {};

        // Verify current passcode
        if (!checkPasscode(current)) {
            return res.status(401).json({
                error: 'Current passcode is wrong',
            });
        }

        // Validate new passcode
        if (typeof next !== 'string' || next.length < 8) {
            return res.status(400).json({
                error: 'New passcode needs 8+ characters',
            });
        }

        // Update passcode
        changePasscode(next);

        return res.json({
            ok: true,
        });
    }
);

export default r;