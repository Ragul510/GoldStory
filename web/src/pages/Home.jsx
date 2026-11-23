import { Link } from 'react-router-dom';
import HowItWorks from '../components/HowItWorks';
//import ProductGrid from '../components/ProductGrid';
import { media, SITE, useProducts } from '../lib/api';
import { useSeo } from '../lib/seo';
import { lazy, Suspense } from 'react';
import HowAreTheyMade from '../components/HowMade';
import AboutStory from '../components/AboutStory';
import TrustBand from '../components/TrustBand';
import ProductGrid3D from '../components/ProductGrid3D';

const Hero3D = lazy(() => import('../components/Hero3D'));

export default function Home() {
    useSeo({ path: '/', description: 'Design personalized 22K and 24K gold bracelets, rings and coins with your name, initials or logo. Live preview, transparent price estimate, made to order in India.' });
    const { products, loading, demo } = useProducts();
    return <HomeView products={products} loading={loading} demo={demo}/>;
}

export function HomeView({ products, loading = false, demo = false }) {
    const itemList = {
        '@context': 'https://schema.org', '@type': 'ItemList', name: 'Personalized gold jewellery',
        itemListElement: products.map((p, i) => ({
            '@type': 'ListItem', position: i + 1,
            item: { '@type': 'Product', name: p.name, description: p.description, image: p.images.map(media), category: p.type, brand: { '@type': 'Brand', name: 'The Gold Story' }, url: `${SITE}/studio?product=${p.slug}` },
        })),
    };

    return (
        <>
      {demo && <div className="demo-banner" role="status">Demo data: the API is not reachable, so you are seeing built-in sample products.</div>}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

            <Suspense fallback={<section style={{ minHeight: '100svh', background: '#0b0907' }} />}>
                <Hero3D />
            </Suspense>

            <div className="w sec" id="cats">
                <h2 style={{ textAlign: 'center' }}>Pieces. Endlessly yours.</h2>
                <ProductGrid3D products={products} loading={loading} />
            </div>

      <HowItWorks />

      {/*       <section className="w sec mk" id="making">
        <h2 style={{ textAlign: 'center', margin: '0 auto .3em' }}>How Are Custom Rings, Bracelets &amp; Coins Made?</h2>
                <svg className="orn" viewBox="0 0 130 16" width="130" height="16" aria-hidden="true">
                    <path d="M10 8h42M78 8h42" stroke="#f0b400" strokeWidth="2" strokeLinecap="round" />
                    <path d="M65 2l6 6-6 6-6-6z" fill="#f0b400" />
                    <path d="M0 8l8-5v10zM130 8l-8-5v10z" fill="#f0b400" />
                </svg>
        <div className="mg">
          {[
            ['You Share Your Idea', 'Tell us the name, initials or logo you want, and whether it goes on a ring, a bracelet or a coin.', 'M4 5h16v11H9l-5 4z'],
            ['We Prepare the Artwork', 'We check your design fits the usable area and turn it into clean, production-ready engraving artwork.', 'M4 20l1-5L16 4l4 4L9 19zM14 6l4 4'],
            ['You Approve the Preview', 'See your name or logo on the piece in the live preview and confirm the design before anything is made.', 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 11-6 0 3 3 0 016 0z'],
            ['The Jeweller Makes It', 'Your piece is crafted in the gold purity you chose. Timeline and hallmark details are confirmed on your order.', 'M6 3h12l4 6-10 12L2 9zM2 9h20M9 9l3 12 3-12M10 3L8 9M14 3l2 6'],
                    ].map(([t, d, p]) => (
                        <div key={t}>
                            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                                <path d={p} />
                            </svg>
                            <h3>{t}</h3>
                            <p>{d}</p>
                        </div>
                    ))}
        </div>
                <p style={{ marginTop: 40 }}>
                    <Link className="btn" to="/studio">Start designing</Link>
                </p>
      </section>

            <section className="w sec" id="about">
                <h2 style={{ textAlign: 'center' }}>About The Gold Story</h2>
                <p style={{ maxWidth: 620, fontSize: '1.1rem', margin: '0 auto', textAlign: 'center' }}>The Gold Story makes personalized 22K and 24K gold bracelets, rings and coins, each one made to order around your name, initials or your own design. You preview it, confirm it, and we make it after design review.</p>
            </section>

            <section className="trust sec" id="shipping">
                <div className="w">
                    <h2 style={{ textAlign: 'center' }}>Clarity, before you commit</h2>
                    <div className="tg">
                        <div>
                            <h3>Purity &amp; hallmark</h3>
                            <p>22K gold is 91.6% pure; 24K is 99.9%. Hallmark details are confirmed on your final piece and shown on your order.</p>
                        </div>
                        <div>
                            <h3>Customization &amp; timelines</h3>
                            <p>Each piece is made to order. The production timeline is confirmed after design review.</p>
                        </div>
                        <div>
                            <h3>Shipping &amp; returns</h3>
                            <p>Personalized items are made specifically for you; see our refund policy for what can be returned.</p>
                        </div>
                        <div>
                            <h3>Secure payments</h3>
                            <p>Payments are handled by a licensed payment gateway. We never see or store your UPI PIN. Orders are confirmed only after the payment is verified.</p>
                        </div>
                    </div>
                </div>
            </section> */}


            <section className="w sec mk" id="making"><HowAreTheyMade /></section>
            <section className="w sec" id="about"><AboutStory /></section>
            <section className="trust sec" id="shipping"><TrustBand /></section>

        </>
    );
}
