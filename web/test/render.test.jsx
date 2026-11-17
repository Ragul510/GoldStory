// Renders the main screens on the server to catch crashes and check key content. Run: npm test
import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HomeView } from '../src/pages/Home.jsx';
import Studio from '../src/components/Studio.jsx';
import Header from '../src/components/Header.jsx';
import Footer from '../src/components/Footer.jsx';
import CoinBadge from '../src/components/CoinBadge.jsx';
import AdminApp from '../src/components/admin/AdminApp.jsx';
const mk = (o) => ({ id: 1, slug: 'gold-bracelet', name: 'Gold Bracelet', type: 'bracelet', description: 'd', purities: ['22K', '24K'], weightG: 9, maxChars: 12, status: 'fulfilled', isNew: true,
    engrave: { cx: 50, cy: 58, w: 27, h: 8, rot: 0 }, images: ['/uploads/products/a.jpg', '/uploads/products/b.jpg'], video: '/uploads/products/v.mp4', ...o });
const products = [mk({}), mk({ id: 2, slug: 'gold-ring', name: 'Gold Ring', purities: ['22K'], video: null }), mk({ id: 3, slug: 'gold-coin', name: 'Gold Coin', status: 'unfulfilled' })];
const r = (el) => renderToString(<MemoryRouter>{el}</MemoryRouter>);
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('  ok -', name); };
ok('home renders hero, 3 product cards, NEW badges, coming soon, how-it-works, about, trust', () => {
    const h = r(<HomeView products={products}/>);
    assert.match(h, /<h1>Your Name\. Your Design\. Your Gold\.<\/h1>/);
    assert.equal((h.match(/class="pc /g) || []).length, 3);
    assert.equal((h.match(/class="nw"/g) || []).length, 3);
    assert.match(h, /Coming soon/);
    assert.match(h, /Gold Bracelet/);
    assert.match(h, /application\/ld\+json/);
    assert.equal((h.match(/class="hk/g) || []).length, 6);
    assert.match(h, /id="about"/);
    assert.match(h, /Clarity, before you commit/);
    assert.doesNotMatch(h, /Personalized Gold/);
});
ok('home shows loading and empty states', () => { assert.match(r(<HomeView products={[]} loading/>), /Loading pieces/); assert.match(r(<HomeView products={[]}/>), /coming soon/i); });
ok('studio: live products only, purity rules, engraving box, gallery, 360 video button', () => {
    const s = r(<Studio products={products}/>);
    assert.match(s, /Gold Bracelet/);
    assert.match(s, /Gold Ring/);
    assert.doesNotMatch(s, /<button[^>]*>Gold Coin<\/button>/);
    assert.match(s, /360° video/);
    assert.match(s, /aria-label="View 2"/);
    assert.match(s, /Price estimate/);
    assert.match(s, /Place order/);
});
ok('studio with no live products shows a friendly message', () => assert.match(r(<Studio products={[mk({ status: 'pending' })]}/>), /No pieces available yet/));
ok('header, footer and coin badge render', () => {
    const x = r(<><Header /><Footer /><CoinBadge /></>);
    assert.match(x, /Customize Your Jewellery/);
    assert.match(x, /WhatsApp support/);
    assert.match(x, /class="coin"/);
    assert.doesNotMatch(x, />Privacy</);
});
ok('admin starts in a loading state (no data leaked before login)', () => { const a = r(<AdminApp />); assert.match(a, /Loading/); assert.doesNotMatch(a, /Our orders/); });
console.log(`\nAll ${n} render checks passed.`);
