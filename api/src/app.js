
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';

import { PRODUCT_DIR } from './db.js';
import { initPasscode } from './auth.js';
import { limiter, originGuard } from './middleware/security.js';

import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminProducts from './routes/adminProducts.js';
import adminOrders from './routes/adminOrders.js';

export function createApp() {
    initPasscode();

    const app = express();
    const prod = process.env.NODE_ENV === 'production';

    app.set('trust proxy', 1);

    // Allowed frontend origins
    // Set ALLOWED_ORIGINS in Render environment variables
    const corsOrigins = (
        process.env.ALLOWED_ORIGINS ||
        'https://gold-story.vercel.app,http://localhost:5173'
    )
        .split(',')
        .map((s) => s.trim().replace(/\/$/, ''))
        .filter(Boolean);

    // CORS middleware must run before routes and origin guard
    app.use(cors({
        origin: corsOrigins,
        credentials: true,
        methods: [
            'GET',
            'HEAD',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS'
        ],
        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ]
    }));

    app.use(helmet({
        crossOriginResourcePolicy: {
            policy: 'cross-origin'
        },
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                'img-src': ["'self'", 'data:', 'blob:'],
                'media-src': ["'self'", 'blob:'],
                'upgrade-insecure-requests': prod ? [] : null,
            }
        }
    }));

    app.use(express.json({ limit: '100kb' }));
    app.use(cookieParser());

    // CSRF origin protection for write requests
    app.use(originGuard(corsOrigins));

    // API rate limiting
    app.use('/api', limiter(15 * 60 * 1000, 600));

    // Public product images and videos
    app.use(
        '/uploads/products',
        express.static(PRODUCT_DIR, {
            maxAge: '30d',
            immutable: true,
            index: false,
            setHeaders: (res) => {
                res.setHeader('X-Content-Type-Options', 'nosniff');
            }
        })
    );

    // API routes
    app.use('/api', publicRoutes);
    app.use('/api/admin', authRoutes);
    app.use('/api/admin/products', adminProducts);
    app.use('/api/admin', adminOrders);

    app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'Not found' });
    });

    // SEO files
    const site = (
        process.env.SITE_URL || 'http://localhost:4000'
    ).replace(/\/$/, '');

    app.get('/robots.txt', (_req, res) => {
        res.type('text/plain').send(
            `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`
        );
    });

    app.get('/sitemap.xml', (_req, res) => {
        res.type('application/xml').send(
            `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            `<url><loc>${site}/</loc><changefreq>weekly</changefreq><priority>1</priority></url>\n` +
            `<url><loc>${site}/studio</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n` +
            `</urlset>\n`
        );
    });

    // React frontend build, if available
    const dist = path.resolve(
        process.env.WEB_DIST ||
        path.join(process.cwd(), '..', 'web', 'dist')
    );

    if (fs.existsSync(path.join(dist, 'index.html'))) {
        app.use(express.static(dist, {
            index: false,
            setHeaders: (res, file) => {
                res.setHeader(
                    'Cache-Control',
                    file.includes(`${path.sep}assets${path.sep}`)
                        ? 'public, max-age=31536000, immutable'
                        : 'public, max-age=3600'
                );
            }
        }));

        app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
            if (req.path.startsWith('/admin')) {
                res.setHeader('X-Robots-Tag', 'noindex, nofollow');
            }

            res.setHeader('Cache-Control', 'no-cache');
            res.sendFile(path.join(dist, 'index.html'));
        });
    }

    // Global error handler
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    });

    return app;
}
