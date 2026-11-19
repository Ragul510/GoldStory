// api/src/lib/models.js

import { db } from '../db.js';

// --------------------------------------------------
// PRODUCT STATUSES
// --------------------------------------------------

export const PRODUCT_STATUSES = [
    'pending',
    'fulfilled',
    'unfulfilled'
];

// --------------------------------------------------
// ENGRAVING FONTS
// --------------------------------------------------

export const FONTS = [
    'Classic',
    'Modern',
    'Script',
    'Elegant'
];

// --------------------------------------------------
// RAW PRODUCT DATABASE QUERY
// --------------------------------------------------

export const rawProduct = (where, value) => {
    return db
        .prepare(`SELECT * FROM products WHERE ${where}`)
        .get(value);
};

// --------------------------------------------------
// UNIQUE PRODUCT SLUG GENERATOR
// --------------------------------------------------

export const uniqueSlug = (name, currentId = null) => {
    const base = String(name)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product';

    let slug = base;
    let counter = 2;

    while (true) {
        const existing = db
            .prepare('SELECT id FROM products WHERE slug = ?')
            .get(slug);

        // Slug is available
        if (!existing) {
            return slug;
        }

        // Existing slug belongs to the same product being updated
        if (
            currentId !== null &&
            String(existing.id) === String(currentId)
        ) {
            return slug;
        }

        // Generate a new slug
        slug = `${base}-${counter}`;
        counter++;
    }
};

// --------------------------------------------------
// GOLD RATES
// --------------------------------------------------

export const getRates = () => {
    return db
        .prepare('SELECT * FROM rates WHERE id = 1')
        .get();
};

// --------------------------------------------------
// PARSE PRODUCT
// --------------------------------------------------

export const parseProduct = (r) => {
    if (!r) return null;

    const images = JSON.parse(r.images || '[]');

    return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        type: r.type,
        description: r.description,

        purities: JSON.parse(r.purities || '[]'),

        weightG: r.weight_g,
        maxChars: r.max_chars,

        status: r.status,
        isNew: !!r.is_new,

        engrave: JSON.parse(r.engrave || '{}'),

        // ImageKit URLs are used directly.
        // Old local filenames remain supported.
        images: images.map((f) =>
            f.startsWith('http')
                ? f
                : `/uploads/products/${f}`
        ),

        // ImageKit video URLs are used directly.
        // Old local video filenames remain supported.
        video: r.video
            ? r.video.startsWith('http')
                ? r.video
                : `/uploads/products/${r.video}`
            : null,

        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
};