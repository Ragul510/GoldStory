import { useEffect } from 'react';
import { SITE } from './api';
const DEFAULT_TITLE = 'The Gold Story | Personalized 22K & 24K Gold Jewellery';
function upsert(selector, make, attr, value) {
    let el = document.head.querySelector(selector);
    if (!el) {
        el = make();
        document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
}
const meta = (key, v) => () => { const m = document.createElement('meta'); m.setAttribute(key, v); return m; };
/** Updates the page title and SEO tags when a route changes (the static defaults live in index.html). */
export function useSeo({ title, description, path = '/', noindex = false }) {
    useEffect(() => {
        const full = title ? `${title} | The Gold Story` : DEFAULT_TITLE;
        document.title = full;
        upsert('meta[name="description"]', meta('name', 'description'), 'content', description);
        upsert('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }, 'href', SITE + path);
        upsert('meta[property="og:title"]', meta('property', 'og:title'), 'content', full);
        upsert('meta[property="og:description"]', meta('property', 'og:description'), 'content', description);
        upsert('meta[property="og:url"]', meta('property', 'og:url'), 'content', SITE + path);
        upsert('meta[name="robots"]', meta('name', 'robots'), 'content', noindex ? 'noindex, nofollow' : 'index, follow');
    }, [title, description, path, noindex]);
}
