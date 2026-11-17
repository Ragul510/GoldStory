import { z } from 'zod';
import { PRODUCT_STATUSES, FONTS } from './models.js';

export const productSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.string().trim().min(2).max(30),
  description: z.string().trim().max(1000).default(''),
  purities: z.array(z.enum(['22K', '24K'])).min(1),
  weight_g: z.number().min(0.1).max(500),
  max_chars: z.number().int().min(1).max(40),
  status: z.enum(PRODUCT_STATUSES),
  is_new: z.boolean(),
  engrave: z.object({ cx: z.number().min(0).max(100), cy: z.number().min(0).max(100), w: z.number().min(1).max(100), h: z.number().min(1).max(100), rot: z.number().min(-180).max(180) }),
});
export const list = (v) => { if (Array.isArray(v)) return v; try { const j = JSON.parse(v); if (Array.isArray(j)) return j; } catch {} return String(v || '').split(',').map((s) => s.trim()).filter(Boolean); };
/** Multipart form fields arrive as strings, so convert them before validating. */
export const bodyToProduct = (b) => productSchema.parse({
  name: b.name, type: b.type, description: b.description ?? '', purities: list(b.purities),
  weight_g: Number(b.weight_g), max_chars: Number(b.max_chars || 12), status: b.status || 'pending',
  is_new: b.is_new === true || b.is_new === 'true' || b.is_new === '1',
  engrave: { cx: Number(b.eng_cx ?? 50), cy: Number(b.eng_cy ?? 50), w: Number(b.eng_w ?? 30), h: Number(b.eng_h ?? 8), rot: Number(b.eng_rot || 0) },
});
export const zodMessage = (e) => (e instanceof z.ZodError ? e.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; ') : e.message);

export const quoteSchema = z.object({ slug: z.string().max(80), purity: z.enum(['22K', '24K']), engraving: z.boolean().default(true) });
export const orderSchema = z.object({
  slug: z.string().max(80), purity: z.enum(['22K', '24K']),
  text: z.string().trim().max(40).optional().default(''), font: z.enum(FONTS).default('Classic'),
  artworkFile: z.string().regex(/^[0-9a-f-]{36}\.(png|jpg|webp)$/).optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(80), mobile: z.string().regex(/^[6-9]\d{9}$/),
    email: z.string().email().max(120).optional().or(z.literal('')), address: z.string().trim().min(10).max(400),
  }),
});
export const rateSchema = z.object({ rate22: z.number().min(0), rate24: z.number().min(0), making: z.number().min(0).max(100), personalization: z.number().min(0), tax: z.number().min(0).max(100), shipping: z.number().min(0) });
