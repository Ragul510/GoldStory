# Backend API routes (Node.js + Express)

Base URL: `http://localhost:4000` (in development the React app reaches it through the Vite proxy, so it calls `/api/...`).
All bodies are JSON unless marked *multipart*. Errors look like `{ "error": "message" }`. Route code: `api/src/routes/`.

## Public routes
| Method | Route | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | | `{ ok: true }` |
| GET | `/api/products` | | Live (`fulfilled`) and "coming soon" (`unfulfilled`) products. Drafts (`pending`) are hidden. |
| GET | `/api/products/:slug` | | One product, or 404 |
| GET | `/api/rates/public` | | `{ ready, updatedAt }` (are gold rates set?) |
| POST | `/api/quote` | `{ slug, purity: "22K"\|"24K", engraving?: true }` | Itemized estimate: `weight, rate, gold, making, tax, shipping, total`. 409 if rates not set or purity not offered. |
| POST | `/api/artwork` | *multipart* `file` (PNG/JPG/WebP, max 2 MB) | `{ file }` (private; only the admin can download it) |
| POST | `/api/orders` | `{ slug, purity, text?, font?, artworkFile?, customer: { name, mobile, email?, address } }` | `201 { id, status, paymentStatus: "unpaid", pricing }`. The price is **recalculated on the server**; any price sent by the browser is ignored. |

## Admin routes (cookie login)
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/api/admin/login` | `{ passcode }` | Sets an httpOnly cookie (8 h). 8 tries per 15 min. |
| POST | `/api/admin/logout` | | |
| GET | `/api/admin/me` | | 200 if logged in, else 401 |
| POST | `/api/admin/passcode` | `{ current, next }` | `next` needs 8+ characters |
| GET | `/api/admin/products` | | All products including drafts |
| POST | `/api/admin/products` | *multipart*: `name, type, description, purities ("22K,24K"), weight_g, max_chars, status, is_new, eng_cx, eng_cy, eng_w, eng_h, eng_rot`, `images` (up to 8), `video` (1) | `201` product |
| PUT | `/api/admin/products/:id` | same fields, plus `removeImages` (JSON array of file names), `removeVideo` ("true") | New images are added; total must stay at 8 or fewer |
| PATCH | `/api/admin/products/:id/status` | `{ status: "pending"\|"fulfilled"\|"unfulfilled" }` | `fulfilled` needs at least one image |
| DELETE | `/api/admin/products/:id` | | Also deletes its image/video files |
| GET | `/api/admin/orders` | | Newest first |
| PATCH | `/api/admin/orders/:id/status` | `{ status }` | Pending, Design Review, In Production, Shipped, Delivered, Cancelled. `Payment Confirmed` is refused: only a verified payment webhook may set it. |
| GET | `/api/admin/artwork/:file` | | Download a customer's uploaded design |
| GET | `/api/admin/customers` | | Grouped by mobile number |
| GET / PUT | `/api/admin/rates` | `{ rate22, rate24, making, tax, shipping }` | |

## Product status meaning
`pending` = hidden draft, `fulfilled` = live and orderable, `unfulfilled` = shown as "Coming soon" (not orderable).

## Try it with curl
```bash
curl http://localhost:4000/api/products
curl -X POST http://localhost:4000/api/quote -H "Content-Type: application/json" -d '{"slug":"gold-bracelet","purity":"22K"}'
curl -c jar.txt -X POST http://localhost:4000/api/admin/login -H "Content-Type: application/json" -d '{"passcode":"YOUR_PASSCODE"}'
curl -b jar.txt http://localhost:4000/api/admin/orders
```

## Dummy data (`npm run seed` / `npm run seed:reset` in `api/`)
- **6 products:** Gold Bracelet (8 images + a 360 video), Gold Ring (4 images), Gold Coin (3 images + a 360 video), Name Pendant (placeholder images), Kids Bracelet (*unfulfilled*, shown as coming soon), Gold Chain (*pending*, hidden draft).
- **6 orders** from 5 "Demo Customer" people in different statuses, and **demo gold rates** (22K 6000, 24K 6500 per gram). The rates are NOT real market prices: set your own in Admin > Edit rates.
- The images are generated placeholders made from your sample photos, and the 360 videos are short dummy clips.
