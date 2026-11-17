import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';
export default function NotFound() {
    useSeo({
        title: 'Page not found',
        description: 'This page does not exist.',
        noindex: true
    });

    return (
        <div className="w sec">
            <h2>Page not found</h2>
            <p><Link className="btn" to="/">Back to home</Link></p>
        </div>
    );
}
