import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useReveal from './useReveal';
import './AboutTrust.css';

const PURITY = [
    ['18K', 75.0, 'Lighter, more durable everyday gold.'],
    ['22K', 91.6, 'Rich, warm traditional gold.'],
    ['24K', 99.9, 'Purest gold, deepest shine.'],
];

/* Animated icons: they loop while the band is on screen */
const Stamp = () => (
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <g className="tb-stamp"><rect x="19" y="3" width="10" height="9" rx="2" /><path d="M24 12v8" /><rect x="12" y="20" width="24" height="8" rx="2" /></g>
        <path d="M10 41h28" /><path className="tb-imp" d="M17 37h14" />
    </svg>
);
const Clock = () => (
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="18" /><path d="M24 12v2M24 34v2M12 24h2M34 24h2" />
        <path className="tb-hand" d="M24 24V12" /><path d="M24 24l7 4" />
    </svg>
);
const Box = () => (
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="24" width="30" height="17" rx="2" /><path className="tb-gd" d="M24 24v17" />
        <g className="tb-lid"><rect x="6" y="15" width="36" height="9" rx="2" /></g>
    </svg>
);
const Lock = () => (
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="11" y="22" width="26" height="19" rx="3" /><circle className="tb-gd" cx="24" cy="31" r="2.5" />
        <path className="tb-shack" d="M16 22v-6a8 8 0 0116 0v6" />
    </svg>
);

// refundTo: set this to the route of your refund policy page
export default function TrustBand({ refundTo = '/refund-policy' }) {
    const [ref, inView] = useReveal();
    const nums = useRef([]);

    // purity percentages count up once the band is visible
    useEffect(() => {
        if (!inView) return undefined;
        const rd = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const t0 = performance.now();
        let raf = 0;
        const step = (n) => {
            const k = rd ? 1 : Math.min(1, (n - t0) / 1600), e = 1 - (1 - k) ** 3;
            PURITY.forEach(([, v], i) => { if (nums.current[i]) nums.current[i].textContent = `${(v * e).toFixed(1)}%`; });
            if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [inView]);

    const cards = [
        [Stamp, 'Purity & hallmark', '18K gold is 75% pure; 22K is 91.6%; 24K is 99.9%. Hallmark details are confirmed on your final piece and shown on your order.'],
        [Clock, 'Customization & timelines', 'Each piece is made to order. The production timeline is confirmed after design review.'],
        [Box, 'Shipping & returns', null],
        [Lock, 'Secure payments', 'Payments are handled by a licensed payment gateway. We never see or store your UPI PIN. Orders are confirmed only after the payment is verified.'],
    ];

    return (
        <div className={`tbx rvs${inView ? ' in' : ''}`} ref={ref}>
            <div className="tbx-in">
                <p className="abx-k rv" style={{ textAlign: 'center' }}>Our promise</p>
                <h2 className="rv" style={{ '--i': 1, textAlign: 'center' }}>Clarity, before you commit</h2>

                <div className="tbx-meter rv" style={{ '--i': 2 }}>
                    <h3>Purity at a glance</h3>
                    {PURITY.map(([k, v, note], i) => (
                        <div className="tbx-row" key={k}>
                            <b>{k}</b>
                            <div className="tbx-bar"><i style={{ '--w': `${v}%` }} /></div>
                            <em ref={(el) => { nums.current[i] = el; }}>0.0%</em>
                            <p className="tbx-note">{note}</p>
                        </div>
                    ))}
                </div>

                <div className="tbx-cards">
                    {cards.map(([Ic, title, text], i) => (
                        <div className="tbx-card rv" style={{ '--i': i }} key={title}>
                            <div className="tbx-ico"><Ic /></div>
                            <h3>{title}</h3>
                            {text
                                ? <p>{text}</p>
                                : <p>Personalized items are made specifically for you; see our <Link to={refundTo}>refund policy</Link> for what can be returned.</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}