import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CoinBadge from './components/CoinBadge';
import { LogoDefs } from './components/Logo';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
// Studio and Admin are loaded only when visited, which keeps the first page light.
const StudioPage = lazy(() => import('./pages/StudioPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
function ScrollToHash() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (hash) {
            const el = document.getElementById(hash.slice(1));
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }
        window.scrollTo(0, 0);
    }, [pathname, hash]);
    return null;
}
export default function App() {
    return (<>
      <LogoDefs />
      <ScrollToHash />
        <Header />
        <main>
            <Suspense fallback={
                <div className="w sec">
                    <p className="note">Loading…</p>
                </div>
            }>

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/studio" element={<StudioPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </main>
        <Footer />
      <CoinBadge />
    </>);
}
