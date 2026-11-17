// Built-in DUMMY products. Used only when the API cannot be reached AND VITE_DEMO_FALLBACK=true,
// so you can look at the frontend on its own. They use the photos in /public/images.
const e = (cx, cy, w, h, rot = 0) => ({ cx, cy, w, h, rot });
const base = { description: 'Demo product', status: 'fulfilled', isNew: true, video: null, weightG: 5, maxChars: 12 };
export const dummyProducts = [
  { ...base, id: 1, slug: 'gold-bracelet', name: 'Gold Bracelet', type: 'bracelet', purities: ['22K', '24K'], images: ['/images/bracelet.jpg'], engrave: e(50, 58.75, 26.9, 7.75) },
  { ...base, id: 2, slug: 'gold-ring', name: 'Gold Ring', type: 'ring', purities: ['22K'], maxChars: 8, images: ['/images/ring.jpg'], engrave: e(49.5, 46.6, 22.9, 4.6, -22.8) },
  { ...base, id: 3, slug: 'gold-coin', name: 'Gold Coin', type: 'coin', purities: ['22K', '24K'], images: ['/images/coin.jpg'], engrave: e(50, 52, 36, 9) },
  { ...base, id: 4, slug: 'name-pendant', name: 'Name Pendant', type: 'pendant', purities: ['22K'], isNew: false, images: ['/images/coin.jpg'], engrave: e(50, 52, 36, 9) },
  { ...base, id: 5, slug: 'kids-bracelet', name: 'Kids Bracelet', type: 'bracelet', purities: ['22K'], status: 'unfulfilled', images: ['/images/bracelet.jpg'], engrave: e(50, 58.75, 26.9, 7.75) },
];
