
// The ONLY place the React app talks to the Node.js backend.
// BASE is '' (same origin): in development Vite proxies /api and /uploads
// to the API (see vite.config.js), and in production the Node server
// serves both the site and the API, so cookies and CORS "just work".

const env = import.meta.env || {};
const BASE = env.VITE_API_URL || '';

/* =========================================
   GLOBAL API LOADING STATE
========================================= */

let activeRequests = 0;

/**
 * Notify GoldStoryLoading about the API loading state.
 *
 * loading = true  -> at least one API request is pending
 * loading = false -> no API requests are pending
 */
function notifyApiLoading(loading) {
    window.dispatchEvent(
        new CustomEvent('goldstory:api-loading', {
            detail: {
                loading,
                requests: activeRequests,
            },
        })
    );
}

/**
 * Called immediately before an API request starts.
 */
function startApiLoading() {
    activeRequests++;

    // Notify only when the first request starts.
    if (activeRequests === 1) {
        notifyApiLoading(true);
    }
}

/**
 * Called immediately after the API response arrives
 * or when the request fails.
 */
function stopApiLoading() {
    activeRequests = Math.max(0, activeRequests - 1);

    // Hide the loader only when every request has finished.
    if (activeRequests === 0) {
        notifyApiLoading(false);
    }
}

/* =========================================
   API REQUEST FUNCTION
========================================= */

/**
 * Returns { ok, status, data } and never throws on HTTP errors.
 *
 * Loading behavior:
 * 1. Start loading before fetch().
 * 2. Wait for the API response.
 * 3. Stop loading immediately when response arrives.
 * 4. Parse the response body.
 *
 * Network failures also stop the loader.
 */
async function send(path, { method = 'GET', json, body } = {}) {
    const init = {
        method,
        headers: {},
        credentials: BASE ? 'include' : 'same-origin',
    };

    if (json !== undefined) {
        init.headers['content-type'] = 'application/json';
        init.body = JSON.stringify(json);
    } else if (body) {
        // FormData: browser automatically sets multipart/form-data.
        init.body = body;
    }

    // API request begins.
    startApiLoading();

    let res;

    try {
        // Wait until the server responds with HTTP response headers.
        res = await fetch(BASE + path, init);
    } finally {
        // API response received OR network request failed.
        // Hide the loading overlay as soon as fetch finishes.
        stopApiLoading();
    }

    // Response body is processed after the loading overlay is stopped.
    let data = null;

    try {
        data = await res.json();
    } catch {
        // Empty or non-JSON response body.
    }

    return {
        ok: res.ok,
        status: res.status,
        data,
    };
}

/**
 * Same as send(), but throws Error(message)
 * when the API response indicates failure.
 *
 * Used by admin screens.
 */
async function must(path, opts) {
    const r = await send(path, opts);

    if (!r.ok) {
        throw new Error(
            r.data?.error || `Request failed (${r.status})`
        );
    }

    return r.data;
}

/* =========================================
   PUBLIC ROUTES
========================================= */

// GET /api/products
export const getProducts = () =>
    must('/api/products');

// GET /api/products/:slug
export const getProduct = (slug) =>
    must(`/api/products/${encodeURIComponent(slug)}`);

// GET /api/rates/public
export const getRatesStatus = () =>
    must('/api/rates/public');

// POST /api/quote
export const getQuote = (slug, purity, engraving = true) =>
    send('/api/quote', {
        method: 'POST',
        json: {
            slug,
            purity,
            engraving,
        },
    });

// POST /api/artwork
export const uploadArtwork = (file) => {
    const fd = new FormData();
    fd.append('file', file);

    return send('/api/artwork', {
        method: 'POST',
        body: fd,
    });
};

// POST /api/orders
export const createOrder = (payload) =>
    send('/api/orders', {
        method: 'POST',
        json: payload,
    });

/* =========================================
   ADMIN ROUTES (NEED ADMIN COOKIE)
========================================= */

// GET /api/admin/me
export const adminMe = async () =>
    (await send('/api/admin/me')).ok;

// POST /api/admin/login
export const adminLogin = (passcode) =>
    must('/api/admin/login', {
        method: 'POST',
        json: {
            passcode,
        },
    });

// POST /api/admin/logout
export const adminLogout = () =>
    must('/api/admin/logout', {
        method: 'POST',
    });

// POST /api/admin/passcode
export const changePasscode = (current, next) =>
    must('/api/admin/passcode', {
        method: 'POST',
        json: {
            current,
            next,
        },
    });

// GET /api/admin/products
export const adminListProducts = () =>
    must('/api/admin/products');

// POST /api/admin/products
// PUT /api/admin/products/:id
export const adminSaveProduct = (id, formData) =>
    must(
        id
            ? `/api/admin/products/${id}`
            : '/api/admin/products',
        {
            method: id ? 'PUT' : 'POST',
            body: formData,
        }
    );

// PATCH /api/admin/products/:id/status
export const adminSetProductStatus = (id, status) =>
    must(`/api/admin/products/${id}/status`, {
        method: 'PATCH',
        json: {
            status,
        },
    });

// DELETE /api/admin/products/:id
export const adminDeleteProduct = (id) =>
    must(`/api/admin/products/${id}`, {
        method: 'DELETE',
    });

// GET /api/admin/orders
export const adminListOrders = () =>
    must('/api/admin/orders');

// PATCH /api/admin/orders/:id/status
export const adminSetOrderStatus = (id, status) =>
    must(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        json: {
            status,
        },
    });

// GET /api/admin/customers
export const adminListCustomers = () =>
    must('/api/admin/customers');

/* =========================================
   ADMIN RATES
========================================= */

// GET /api/admin/rates
export const adminGetRates = () =>
    must('/api/admin/rates');

// PUT /api/admin/rates
export const adminSaveRates = (rates) =>
    must('/api/admin/rates', {
        method: 'PUT',
        json: rates,
    });

/* =========================================
   ARTWORK URL
========================================= */

export const artworkUrl = (file) =>
    `${BASE}/api/admin/artwork/${file}`;
