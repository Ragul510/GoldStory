// api/src/lib/models.js

// Product order statuses
export const PRODUCT_STATUSES = [
    'pending',
    'fulfilled',
    'unfulfilled'
];

// Allowed engraving fonts
export const FONTS = [
    'Classic',
    'Modern',
    'Script',
    'Elegant'
];

// Parse database product row into API response
export const parseProduct = (r) => {
    if (!r) return null;

    const images = JSON.parse(r.images);

    return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        type: r.type,
        description: r.description,
        purities: JSON.parse(r.purities),
        weightG: r.weight_g,
        maxChars: r.max_chars,
        status: r.status,
        isNew: !!r.is_new,
        engrave: JSON.parse(r.engrave),

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