import React,{ useEffect, useState } from 'react';
import { getProducts } from '../services/api';
import { dummyProducts } from '../data/dummyProducts';
import { apiLoadingStart, apiLoadingEnd } from '../utils/apiLoading';

const env = import.meta.env || {};

export const SITE =
    env.VITE_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

const DEMO_FALLBACK = env.VITE_DEMO_FALLBACK === 'true';

/** Product media is served by the API on the same origin (proxied by Vite in dev). */
export const media = (p) => p;

/**
 * Loads the public product list from the backend (GET /api/products).
 *
 * Global loading overlay:
 * - Starts when the API request begins.
 * - Ends when the request finishes.
 *
 * If the API is down and VITE_DEMO_FALLBACK=true,
 * built-in dummy products are shown and demo=true.
 */
export function useProducts() {
    const [s, setS] = useState({
        products: [],
        loading: true,
        error: false,
        demo: false,
    });

    useEffect(() => {
        let live = true;

        const loadProducts = async () => {
            apiLoadingStart();

            try {
                const products = await getProducts();

                if (live) {
                    setS({
                        products,
                        loading: false,
                        error: false,
                        demo: false,
                    });
                }
            } catch (error) {
                console.error('Failed to load products:', error);

                if (live) {
                    setS(
                        DEMO_FALLBACK
                            ? {
                                products: dummyProducts,
                                loading: false,
                                error: true,
                                demo: true,
                            }
                            : {
                                products: [],
                                loading: false,
                                error: true,
                                demo: false,
                            }
                    );
                }
            } finally {
                apiLoadingEnd();
            }
        };

        loadProducts();

        return () => {
            live = false;
        };
    }, []);

    return s;
}
