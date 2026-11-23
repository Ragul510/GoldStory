import { useEffect, useRef, useState } from 'react';

// Returns [ref, inView]. inView turns true once, when the element is ~18% on screen.
// With reduced motion (or no IntersectionObserver) it is true immediately.
export default function useReveal(threshold = 0.18) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
            setInView(true); return undefined;
        }
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold });
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);
    return [ref, inView];
}