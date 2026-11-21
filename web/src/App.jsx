
import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import CoinBadge from './components/CoinBadge';
import { LogoDefs } from './components/Logo';
import GoldStoryLoading from './components/GoldStoryLoading';

import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Studio and Admin are loaded only when visited.
// This keeps the first page light.
const StudioPage = lazy(() => import('./pages/StudioPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));


/* =========================================
   SCROLL TO HASH / TOP
========================================= */

function ScrollToHash() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const el = document.getElementById(hash.slice(1));

            if (el) {
                el.scrollIntoView({
                    behavior: 'smooth',
                });

                return;
            }
        }

        window.scrollTo(0, 0);
    }, [pathname, hash]);

    return null;
}


/* =========================================
   APP
========================================= */

export default function App() {
    return (
        <>
            {/* SVG logo definitions */}
            <LogoDefs />

            {/* Scroll management */}
            <ScrollToHash />

            {/* Header */}
            <Header />

            {/* GLOBAL API LOADING OVERLAY */}
            {/* Appears only while API requests are pending */}
            <GoldStoryLoading />

            {/* Main content */}
            <main>
                <Suspense fallback={null}>
                    <Routes>
                        <Route
                            path="/"
                            element={<Home />}
                        />

                        <Route
                            path="/studio"
                            element={<StudioPage />}
                        />

                        <Route
                            path="/admin"
                            element={<AdminPage />}
                        />

                        <Route
                            path="*"
                            element={<NotFound />}
                        />
                    </Routes>
                </Suspense>
            </main>

            {/* Footer */}
            <Footer />

            {/* Floating CoinBadge */}
            <CoinBadge />
        </>
    );
}
