let activeRequests = 0;

function notify() {
    window.dispatchEvent(
        new CustomEvent('goldstory:api-loading', {
            detail: {
                loading: activeRequests > 0,
                requests: activeRequests,
            },
        })
    );
}

export function apiLoadingStart() {
    activeRequests++;
    notify();
}

export function apiLoadingEnd() {
    activeRequests = Math.max(0, activeRequests - 1);
    notify();
}