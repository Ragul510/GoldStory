import { db } from '../db.js';

/* =========================================
   PRODUCT CONSTANTS
========================================= */

export const PRODUCT_STATUSES = [
    'pending',
    'fulfilled',
    'unfulfilled',
];

export const FONTS = [
    'Classic',
    'Modern',
    'Script',
    'Elegant',
];

/* =========================================
   ORDER CONSTANTS
========================================= */

export const ORDER_STATUSES = [
    'Pending',
    'Processing',
    'Completed',
    'Cancelled',
    'Payment Confirmed',
];

/* =========================================
   JSON HELPER
========================================= */

function safeJSON(value, fallback = []) {
    if (!value) return fallback;

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

/* =========================================
   PRODUCT DATABASE HELPERS
========================================= */

/**
 * Fetch a product using a WHERE condition.
 *
 * Examples:
 * rawProduct('id = ?', id)
 * rawProduct('slug = ?', slug)
 */
export function rawProduct(where, value) {
    return db
        .prepare(`SELECT * FROM products WHERE ${where}`)
        .get(value);
}

/**
 * Generate a unique product slug.
 *
 * Example:
 * Custom Ring
 * -> custom-ring
 * -> custom-ring-2
 * -> custom-ring-3
 */
export function uniqueSlug(name, currentId = null) {
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

        // Slug does not exist
        if (!existing) {
            return slug;
        }

        // Editing the same product: retain its slug
        if (
            currentId !== null &&
            String(existing.id) === String(currentId)
        ) {
            return slug;
        }

        // Generate another unique slug
        slug = `${base}-${counter}`;
        counter++;
    }
}

/* =========================================
   PRODUCT PARSER
========================================= */

/**
 * Convert database product row into API product object.
 */
export function parseProduct(row) {
    if (!row) return null;

    const images = safeJSON(row.images, []);

    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        type: row.type,
        description: row.description,

        purities: safeJSON(row.purities, []),

        weightG: row.weight_g,
        maxChars: row.max_chars,

        status: row.status,
        isNew: Boolean(row.is_new),
        engrave: Boolean(row.engrave),

        images: images.map((file) => {
            if (!file) return null;

            // ImageKit URL
            if (
                typeof file === 'string' &&
                /^https?:\/\//i.test(file)
            ) {
                return file;
            }

            // Legacy local image
            return `/uploads/products/${file}`;
        }).filter(Boolean),

        video: row.video
            ? (
                /^https?:\/\//i.test(row.video)
                    ? row.video
                    : `/uploads/products/${row.video}`
            )
            : null,

        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/* =========================================
   RATE HELPERS
========================================= */

/**
 * Get current gold pricing and settings.
 */
export function getRates() {
    return db
        .prepare('SELECT * FROM rates WHERE id = 1')
        .get();
}

/* =========================================
   ORDER PARSER
========================================= */

/**
 * Convert database order row into API order object.
 */
export function parseOrder(row) {
    if (!row) return null;

    return {
        id: row.id,

        productId: row.product_id,
        productName: row.product_name,

        purity: row.purity,
        engravingText: row.engraving_text,
        font: row.font,

        artworkFile: row.artwork_file,

        weightG: row.weight_g,
        rateUsed: row.rate_used,

        pricing: safeJSON(row.pricing, {}),
        customer: safeJSON(row.customer, {}),

        paymentStatus: row.payment_status,
        paymentRef: row.payment_ref,

        status: row.status,

        createdAt: row.created_at,
    };
}