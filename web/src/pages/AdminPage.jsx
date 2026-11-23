import AdminApp from '../components/admin/AdminApp';
import { useSeo } from '../lib/seo';
export default function AdminPage() {
    useSeo({
        title: 'Admin',
        description: 'Admin',
        path: '/admin',
        noindex: true
    });

    return (
        <div id="p-admin">

            <AdminApp />
        </div>
    );
}
