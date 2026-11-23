import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HowMade.css';

const STEPS = [
    ['You Share Your Idea', 'Tell us the name, initials or logo you want, and whether it goes on a ring, a bracelet or a coin.'],
    ['We Prepare the Artwork', 'We check your design fits the usable area and turn it into clean, production-ready engraving artwork.'],
    ['You Approve the Preview', 'See your name or logo on the piece in the live preview and confirm the design before anything is made.'],
    ['The Jeweller Makes It', 'Your piece is crafted in the gold purity you chose. Timeline and hallmark details are confirmed on your order.'],
];

/* Animated icons: each loops a tiny story while its step is lit */
const Chat = () => (
    <svg className="hm-ic" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 10h32a2 2 0 012 2v18a2 2 0 01-2 2H20l-8 7v-7H8a2 2 0 01-2-2V12a2 2 0 012-2z" />
        <path className="hm-type" d="M14 21h18" />
        <rect className="hm-cur" x="14" y="16.5" width="2.6" height="9" rx="1" />
    </svg>
);
const Pencil = () => (
    <svg className="hm-ic" viewBox="0 0 48 48" aria-hidden="true">
        <rect className="hm-trace" x="6" y="26" width="34" height="14" rx="7" />
        <g className="hm-pen"><path d="M35 5l8 8-19 19-9 2 2-9z" /></g>
    </svg>
);
const Eye = () => (
    <svg className="hm-ic" viewBox="0 0 48 48" aria-hidden="true">
        <g className="hm-blink">
            <path d="M3 26s8-13 21-13 21 13 21 13-8 13-21 13S3 26 3 26z" />
            <circle cx="24" cy="26" r="6" />
        </g>
        <path className="hm-spark" style={{ animationDelay: '0s' }} d="M39 4l1.6 3.8L44.5 9.5l-3.9 1.7L39 15l-1.6-3.8L33.5 9.5l3.9-1.7z" />
    </svg>
);
const Gem = () => (
    <svg className="hm-ic" viewBox="-5 -5 34 34" aria-hidden="true" style={{ strokeWidth: 1.6 }}>
        <path d="M6 3h12l4 6-10 12L2 9zM2 9h20M9 9l3 12 3-12M10 3L8 9M14 3l2 6" />
        <path className="hm-spark" style={{ animationDelay: '.2s' }} d="M22 -3l.9 2.1L25 0l-2.1.9L22 3l-.9-2.1L19 0l2.1-.9z" />
        <path className="hm-spark" style={{ animationDelay: '1s' }} d="M1 -2l.7 1.6L3.3 0l-1.6.7L1 2.3.3.7-1.3 0l1.6-.4z" />
    </svg>
);
const ICONS = [Chat, Pencil, Eye, Gem];

export default function HowAreTheyMade() {
    const wrap = useRef(null);
    const [lit, setLit] = useState(0);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const el = wrap.current;
        setReady(true);
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.style.setProperty('--p', 1); setLit(STEPS.length); return undefined;
        }
        let raf = 0, vis = false, cur = -1;
        const calc = () => {
            raf = 0;
            const r = el.getBoundingClientRect(), vh = innerHeight;
            const p = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.25)));
            el.style.setProperty('--p', p.toFixed(3));
            let n = 0;
            for (let i = 0; i < STEPS.length; i++) if (p >= 0.05 + i * 0.28) n = i + 1;
            if (n !== cur) { cur = n; setLit(n); }
        };
        const kick = () => { if (!raf) raf = requestAnimationFrame(calc); };
        const onScroll = () => { if (vis) kick(); };
        const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) kick(); });
        io.observe(el);
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', kick);
        calc();
        return () => { io.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('resize', kick); cancelAnimationFrame(raf); };
    }, []);

    const done = lit === STEPS.length;
    return (
        <div className={`hm${ready ? ' ready' : ''}${done ? ' done' : ''}`}>
            <h2 style={{ textAlign: 'center', margin: '0 auto .3em' }}>How Are Custom Rings, Bracelets &amp; Coins Made?</h2>
            <svg className="orn" viewBox="0 0 130 16" width="130" height="16" aria-hidden="true">
                <path d="M10 8h42M78 8h42" stroke="#f0b400" strokeWidth="2" strokeLinecap="round" />
                <path d="M65 2l6 6-6 6-6-6z" fill="#f0b400" />
                <path d="M0 8l8-5v10zM130 8l-8-5v10z" fill="#f0b400" />
            </svg>

            <div className="hm-wrap" ref={wrap}>
                <span className="hm-line" aria-hidden="true"><i className="hm-fill" /></span>
                <ol className="hm-list">
                    {STEPS.map(([t, d], i) => {
                        const Ic = ICONS[i];
                        return (
                            <li key={t} className={`hm-li${lit > i ? ' on' : ''}`} style={{ '--i': i }}>
                                <div className="hm-node"><Ic /><b className="hm-num">{i + 1}</b></div>
                                <div className="hm-body"><h3>{t}</h3><p>{d}</p></div>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <p className="hm-cta"><Link className="btn" to="/studio">Start designing</Link></p>
        </div>
    );
}