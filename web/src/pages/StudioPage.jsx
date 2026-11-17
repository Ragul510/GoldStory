import Studio from '../components/Studio';
import { useProducts } from '../lib/api';
import { useSeo } from '../lib/seo';
export default function StudioPage() {
    useSeo({
        title: 'Customize Your Gold Jewellery',
        path: '/studio',
        description: 'Design a personalized 22K or 24K gold bracelet, ring or coin. Type your name or upload a logo, see a live preview and an itemized price estimate.'
    });

    const { products, loading } = useProducts();

    if (loading) {
        return (
            <div id="p-studio">
                <div className="w studio">
                    <p className="note">Loading…</p>
                </div>
            </div>
        );
    }

    return (
        <div id="p-studio">
            <Studio products={products} />
        </div>
    );
}
