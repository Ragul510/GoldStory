// ADMIN PRODUCT routes (cookie login required):
//   GET    /api/admin/products
//   POST   /api/admin/products
//   PUT    /api/admin/products/:id
//   PATCH  /api/admin/products/:id/status
//   DELETE /api/admin/products/:id

import { Router } from 'express';
import fs from 'node:fs';

import { db, PRODUCT_DIR } from '../db.js';
import { requireAdmin } from '../auth.js';
import { productUpload, sniff, removeFiles, MAX_IMAGE } from '../upload.js';
import imagekit from '../imagekit.js';

import {
    PRODUCT_STATUSES,
    parseProduct,
    rawProduct,
    uniqueSlug,
} from '../lib/models.js';

import {
    bodyToProduct,
    list,
    zodMessage,
} from '../lib/validation.js';

const r = Router();

r.use(requireAdmin);

// --------------------------------------------------
// GET ALL PRODUCTS
// --------------------------------------------------

r.get('/', (_req, res) => {
    const products = db
        .prepare('select * from products order by id desc')
        .all()
        .map(parseProduct);

    res.json(products);
});

// --------------------------------------------------
// VALIDATE UPLOADS
// --------------------------------------------------

function readUploads(req, res, next) {
    productUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                error:
                    err.code === 'LIMIT_UNEXPECTED_FILE'
                        ? 'Up to 8 images and 1 video'
                        : err.message,
            });
        }

        const imgs = req.files?.images || [];
        const vid = req.files?.video?.[0];

        const all = [...imgs, ...(vid ? [vid] : [])];

        const bad = all.find(
            (f) =>
                !sniff(f) ||
                (f.mimetype.startsWith('image/') && f.size > MAX_IMAGE)
        );

        if (bad) {
            removeFiles(
                PRODUCT_DIR,
                all.map((f) => f.filename)
            );

            return res.status(400).json({
                error: `Rejected ${bad.originalname}: invalid file or larger than 8 MB`,
            });
        }

        req.newImages = imgs;
        req.newVideo = vid || null;

        next();
    });
}

// --------------------------------------------------
// UPLOAD FILE TO IMAGEKIT
// --------------------------------------------------

async function uploadToImageKit(file, folder = '/gold-story/products') {
    const uploaded = await imagekit.files.upload({
        file: fs.createReadStream(file.path),
        fileName: file.filename,
        folder,
    });

    return uploaded.url;
}

// --------------------------------------------------
// UPLOAD ALL NEW MEDIA
// --------------------------------------------------

async function uploadMedia(req) {
    const uploadedImages = [];
    let uploadedVideo = null;

    try {
        for (const file of req.newImages || []) {
            const url = await uploadToImageKit(file);
            uploadedImages.push(url);
        }

        if (req.newVideo) {
            uploadedVideo = await uploadToImageKit(
                req.newVideo,
                '/gold-story/products/videos'
            );
        }

        return {
            images: uploadedImages,
            video: uploadedVideo,
        };
    } finally {
        // Delete temporary files from Render
        const files = [
            ...(req.newImages || []),
            ...(req.newVideo ? [req.newVideo] : []),
        ];

        removeFiles(
            PRODUCT_DIR,
            files.map((f) => f.filename)
        );
    }
}

// --------------------------------------------------
// CREATE PRODUCT
// --------------------------------------------------

r.post('/', readUploads, async (req, res) => {
    try {
        const d = bodyToProduct(req.body);

        if (req.newImages.length > 8) {
            throw new Error('Up to 8 images');
        }

        if (d.status === 'fulfilled' && !req.newImages.length) {
            throw new Error(
                'Add at least one image before marking a product fulfilled'
            );
        }

        // Upload media to ImageKit
        const media = await uploadMedia(req);

        const info = db
            .prepare(
                `insert into products(
          slug,
          name,
          type,
          description,
          purities,
          weight_g,
          max_chars,
          status,
          is_new,
          engrave,
          images,
          video
        ) values(?,?,?,?,?,?,?,?,?,?,?,?)`
            )
            .run(
                uniqueSlug(d.name),
                d.name,
                d.type,
                d.description,
                JSON.stringify(d.purities),
                d.weight_g,
                d.max_chars,
                d.status,
                d.is_new ? 1 : 0,
                JSON.stringify(d.engrave),
                JSON.stringify(media.images),
                media.video
            );

        const product = rawProduct('id=?', info.lastInsertRowid);

        res.status(201).json(parseProduct(product));
    } catch (e) {
        // Remove any temporary files if something failed
        if (req.newImages || req.newVideo) {
            const files = [
                ...(req.newImages || []),
                ...(req.newVideo ? [req.newVideo] : []),
            ];

            removeFiles(
                PRODUCT_DIR,
                files.map((f) => f.filename)
            );
        }

        console.error('Product creation error:', e);

        res.status(400).json({
            error: zodMessage(e) || e.message || 'Product upload failed',
        });
    }
});

// --------------------------------------------------
// UPDATE PRODUCT
// --------------------------------------------------

r.put('/:id', readUploads, async (req, res) => {
    try {
        const cur = rawProduct('id=?', req.params.id);

        if (!cur) {
            throw new Error('Product not found');
        }

        const d = bodyToProduct(req.body);

        const remove = list(req.body.removeImages);

        const oldImages = JSON.parse(cur.images);

        // Existing image URLs that should remain
        const remainingImages = oldImages.filter(
            (f) => !remove.includes(f)
        );

        // Upload newly added images to ImageKit
        const media = await uploadMedia(req);

        const images = [
            ...remainingImages,
            ...media.images,
        ];

        if (images.length > 8) {
            throw new Error(`Up to 8 images (you have ${images.length})`);
        }

        if (d.status === 'fulfilled' && !images.length) {
            throw new Error(
                'Add at least one image before marking a product fulfilled'
            );
        }

        const dropVideo =
            req.body.removeVideo === 'true' ||
            !!media.video;

        const video =
            media.video ||
            (dropVideo ? null : cur.video);

        db.prepare(
            `update products set
        slug=?,
        name=?,
        type=?,
        description=?,
        purities=?,
        weight_g=?,
        max_chars=?,
        status=?,
        is_new=?,
        engrave=?,
        images=?,
        video=?,
        updated_at=datetime('now')
      where id=?`
        ).run(
            uniqueSlug(d.name, cur.id),
            d.name,
            d.type,
            d.description,
            JSON.stringify(d.purities),
            d.weight_g,
            d.max_chars,
            d.status,
            d.is_new ? 1 : 0,
            JSON.stringify(d.engrave),
            JSON.stringify(images),
            video,
            cur.id
        );

        // Delete old LOCAL files only.
        // ImageKit files are stored remotely and are not deleted here.
        const localFiles = oldImages.filter(
            (f) => !f.startsWith('http') && remove.includes(f)
        );

        removeFiles(PRODUCT_DIR, localFiles);

        if (
            dropVideo &&
            cur.video &&
            !cur.video.startsWith('http')
        ) {
            removeFiles(PRODUCT_DIR, [cur.video]);
        }

        res.json(parseProduct(rawProduct('id=?', cur.id)));
    } catch (e) {
        if (req.newImages || req.newVideo) {
            const files = [
                ...(req.newImages || []),
                ...(req.newVideo ? [req.newVideo] : []),
            ];

            removeFiles(
                PRODUCT_DIR,
                files.map((f) => f.filename)
            );
        }

        console.error('Product update error:', e);

        res.status(400).json({
            error: zodMessage(e) || e.message || 'Product update failed',
        });
    }
});

// --------------------------------------------------
// UPDATE PRODUCT STATUS
// --------------------------------------------------

r.patch('/:id/status', (req, res) => {
    const s = req.body?.status;

    if (!PRODUCT_STATUSES.includes(s)) {
        return res.status(400).json({
            error: 'Status must be pending, fulfilled or unfulfilled',
        });
    }

    const cur = rawProduct('id=?', req.params.id);

    if (!cur) {
        return res.status(404).json({
            error: 'Not found',
        });
    }

    if (s === 'fulfilled' && !JSON.parse(cur.images).length) {
        return res.status(400).json({
            error: 'Add an image first',
        });
    }

    db.prepare(
        "update products set status=?,updated_at=datetime('now') where id=?"
    ).run(s, cur.id);

    res.json(parseProduct(rawProduct('id=?', cur.id)));
});

// --------------------------------------------------
// DELETE PRODUCT
// --------------------------------------------------

r.delete('/:id', (req, res) => {
    const cur = rawProduct('id=?', req.params.id);

    if (!cur) {
        return res.status(404).json({
            error: 'Not found',
        });
    }

    db.prepare('delete from products where id=?').run(cur.id);

    // Only delete local files.
    // ImageKit media remains stored remotely.
    const localImages = JSON.parse(cur.images).filter(
        (f) => !f.startsWith('http')
    );

    const localVideo =
        cur.video && !cur.video.startsWith('http')
            ? [cur.video]
            : [];

    removeFiles(PRODUCT_DIR, [
        ...localImages,
        ...localVideo,
    ]);

    res.json({
        ok: true,
    });
});

export default r;