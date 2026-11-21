import { db } from '../db.js';

/* =========================================================
   PRODUCT CONSTANTS
========================================================= */

export const PRODUCT_STATUSES = [
    'pending',
    'fulfilled',
    'unfulfilled',
];

/* Keep these font names consistent with the frontend */
export const FONTS = [
    'Classic',
    'Modern',
    'Script',
    'Elegant',
];

/* =========================================================
   ORDER CONSTANTS
========================================================= */

export const ORDER_STATUSES = [
    'Pending',
    'Processing',
    'Completed',
    'Cancelled',
    'Payment Confirmed',
];

/* =========================================================
   DATABASE HELPERS
========================================================= */

/**
 * Fetch a raw product from the database.
 *
 * Example:
 * rawProduct('id = ?', productId)
 * rawProduct('slug = ?', slug)
 */
export function rawProduct(where, value) {
    return db.prepare(
        `SELECT * FROM products WHERE ${where}`
    ).get(value);
}

/**
 * Generate a unique product slug.
 *
 * Example:
 * Custom Ring
 * custom-ring
 * custom-ring-2
 * custom-ring-3
 */
export function uniqueSlug(name, currentId = null) {
    const base = String(name || 'product')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product';

    let slug = base;
    let counter = 2;

    while (true) {
        const existing = db.prepare(
            'SELECT id FROM products WHERE slug = ?'
        ).get(slug);

        if (!existing) {
            return slug;
        }

        // Allow the existing product to retain its own slug
        if (
            currentId !== null &&
            String(existing.id) === String(currentId)
        ) {
            return slug;
        }

        slug = `${base}-${counter}`;
        counter++;
    }
}

/* =========================================================
   GOLD RATES
========================================================= */

/**
 * Get current rates from the database.
 *
 * Database table:
 * rates
 *
 * Columns:
 * rate24
 * rate22
 * rate18
 * making
 * tax
 * shipping
 * updated_at
 */
export function getRates() {
    return db.prepare(
        'SELECT * FROM rates WHERE id = 1'
    ).get();
}

/* =========================================================
   PRODUCT PARSER
========================================================= */

/**
 * Convert database product data into API-friendly data.
 */
export function parseProduct(row) {
    if (!row) return null;

    let images = [];

    try {
        images = JSON.parse(row.images || '[]');
    } catch {
        images = [];
    }

    // Convert old local file paths to public URLs.
    // ImageKit URLs are kept unchanged.
    images = images.map((image) => {
        if (!image) return image;

        if (
            image.startsWith('http://') ||
            image.startsWith('https://')
        ) {
            return image;
        }

        return `/uploads/products/${image}`;
    });

    let video = null;

    if (row.video) {
        if (
            row.video.startsWith('http://') ||
            row.video.startsWith('https://')
        ) {
            video = row.video;
        } else {
            video = `/uploads/products/${row.video}`;
        }
    }

    let purities = [];

    try {
        purities = JSON.parse(row.purities || '[]');
    } catch {
        purities = [];
    }

    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        type: row.type,
        description: row.description,

        purities,

        weightG: row.weight_g,
        maxChars: row.max_chars,

        status: row.status,
        isNew: Boolean(row.is_new),
        engrave: Boolean(row.engrave),

        images,
        video,

        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/* =========================================================
   ORDER PARSER
========================================================= */

/**
 * Convert database order data into API-friendly data.
 */
export function parseOrder(row) {
    if (!row) return null;

    let pricing = {};
    let customer = {};

    try {
        pricing = JSON.parse(row.pricing || '{}');
    } catch {
        pricing = {};
    }

    try {
        customer = JSON.parse(row.customer || '{}');
    } catch {
        customer = {};
    }

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

        pricing,
        customer,

        paymentStatus: row.payment_status,
        paymentRef: row.payment_ref,

        status: row.status,

        createdAt: row.created_at,
    };
}