import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { media } from '../lib/api';
import './ProductGrid3D.css';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const norm = (a) => ((a % 360) + 540) % 360 - 180;

function Carousel({ p }) {
    const imgs = p.images || [];
    // Video is optional. Adjust this line if your video field has another name.
    const video = p.video || p.videoUrl || p.videos?.[0] || null;
    const items = [...(video ? [{ k: 'video' }] : []), ...imgs.map((src, i) => ({ k: 'img', src, i }))];
    const N = items.length;
    const slots = Math.max(N, 3);
    const STEP = 360 / slots;

    const root = useRef(null), stage = useRef(null), ring = useRef(null), vid = useRef(null), pn = useRef([]);
    const S = useRef({ th: 0, tg: null, drag: false, moved: 0, x: 0, hover: false, resume: 0, vis: false, allow: true, holdUntil: 0, front: -1 });
    const [front, setFront] = useState(0);
    const [vsrc, setVsrc] = useState(false);   // video file is requested only once the card is on screen
    const [W, setW] = useState(300);           // card width: portrait panels always fill it
    const RAD = Math.round(W / 2 / Math.tan(Math.PI / slots));

    useEffect(() => {
        const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.round(e.contentRect.width))));
        ro.observe(stage.current);
        return () => ro.disconnect();
    }, []);

    const snap = useCallback((i, user) => {
        const s = S.current;
        s.tg = s.th + norm(-i * STEP - s.th);
        if (user && video && i === 0) s.allow = true; // visitor asked for the video again
    }, [STEP, video]);
    const frontOf = (th) => ((Math.round(-th / STEP) % slots) + slots) % slots;

    useEffect(() => {
        if (!N) return undefined;
        const s = S.current, rd = reduced(), v = () => vid.current;
        const onFront = (fr, now) => {
            if (!v()) return;
            if (fr === 0 && s.allow) { v().currentTime = 0; s.holdUntil = now + 8000; v().play().catch(() => { }); }
            else v().pause();
        };
        const io = new IntersectionObserver(([e]) => {
            s.vis = e.isIntersecting;
            if (e.isIntersecting && video) setVsrc(true);
            if (!e.isIntersecting) v()?.pause();
            else if (s.front === 0 && s.allow) v()?.play().catch(() => { });
        }, { threshold: 0.25 });
        io.observe(root.current);

        let raf, last = performance.now();
        const frame = (now) => {
            raf = requestAnimationFrame(frame);
            if (!s.vis) { last = now; return; }
            const dt = Math.min(40, now - last); last = now;
            const holding = video && s.front === 0 && s.allow && now < s.holdUntil; // video runs first
            if (s.tg !== null) {
                s.th += (s.tg - s.th) * 0.12;
                if (Math.abs(s.tg - s.th) < 0.1) { s.th = s.tg; s.tg = null; s.resume = now + 2200; }
            } else if (!s.drag && !s.hover && !rd && N > 1 && now > s.resume && !holding) s.th -= dt * 0.012;

            ring.current.style.transform = `translateZ(${-RAD}px) rotateY(${s.th}deg)`;
            for (let i = 0; i < N; i++) {
                const el = pn.current[i]; if (!el) continue;
                const a = norm(i * STEP + s.th);
                el.style.opacity = Math.max(0, 1 - Math.abs(a) / 70).toFixed(2);
                el.style.zIndex = Math.round(100 - Math.abs(a));
            }
            const fr = frontOf(s.th);
            if (fr !== s.front) { s.front = fr; if (fr < N) setFront(fr); onFront(fr, now); }
        };
        raf = requestAnimationFrame(frame);
        return () => { cancelAnimationFrame(raf); io.disconnect(); v()?.pause(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [N, RAD, STEP, video]);

    const videoDone = () => { const s = S.current; s.allow = false; s.holdUntil = 0; if (N > 1) snap(1, false); };

    const down = (e) => { const s = S.current; s.drag = true; s.moved = 0; s.x = e.clientX; s.tg = null; e.currentTarget.setPointerCapture(e.pointerId); };
    const move = (e) => { const s = S.current; if (!s.drag) return; const dx = e.clientX - s.x; s.x = e.clientX; s.moved += Math.abs(dx); s.th += dx * 0.35; };
    const up = (e) => {
        const s = S.current; s.drag = false; s.resume = performance.now() + 1800;
        if (s.moved >= 6) snap(Math.min(frontOf(s.th), N - 1), true);
    };
    const key = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); snap((front + 1) % N, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); snap((front - 1 + N) % N, true); }
    };

    const caption = video && front === 0 ? 'Video' : `Image ${video ? front : front + 1} of ${imgs.length}`;

    return (
        <div className="pc3" ref={root}>
            <div className="pc3-stage" ref={stage} tabIndex={N ? 0 : -1} role="group" aria-roledescription="carousel" aria-label={`${p.name} gallery`}
                style={{ '--w': `${W}px`, perspective: `${W * 3}px` }}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') S.current.hover = true; }}
                onPointerLeave={() => { S.current.hover = false; }}
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { S.current.drag = false; }}
                onKeyDown={key}>
                <div className="pc3-ring" ref={ring}>
                    {items.map((it, i) => (
                        <div key={i} className="pc3-pn" ref={(el) => { pn.current[i] = el; }}
                            style={{ transform: `rotateY(${i * STEP}deg) translateZ(${RAD}px)` }}>
                            {it.k === 'video' ? (
                                <video ref={vid} src={vsrc ? media(video) : undefined} poster={imgs[0] ? media(imgs[0]) : undefined}
                                    muted playsInline preload="metadata"
                                    onLoadedData={() => { const s = S.current; if (s.vis && s.front === 0 && s.allow) vid.current?.play().catch(() => { }); }}
                                    onPlaying={() => { S.current.holdUntil = Infinity; }}
                                    onEnded={videoDone} onError={videoDone} />
                            ) : (
                                <img src={media(it.src)} alt={`${p.name} – image ${it.i + 1}`} width={600} height={800} loading="lazy" decoding="async" draggable={false} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Info on top of the image, like a media card */}
            <div className="pc3-top">
                {p.type && <div className="pc3-type">{p.type}</div>}
                <h3>{p.name}</h3>
                {p.description && <p>{p.description}</p>}
            </div>
            <div className="pc3-bot">
                <div className="pc3-left">
                    {N > 0 && <span className="pc3-cap">{caption}</span>}
                    {N > 1 && (
                        <span className="pc3-dots">
                            {items.map((it, i) => (
                                <button key={i} type="button" className={i === front ? 'on' : ''}
                                    aria-label={it.k === 'video' ? 'Show video' : `Show image ${it.i + 1}`} onClick={() => snap(i, true)} />
                            ))}
                        </span>
                    )}
                </div>
                <Link className="pc3-go" to={`/studio?product=${p.slug}`}>Customize</Link>
            </div>
        </div>
    );
}

export default function ProductGrid3D({ products = [], loading = false }) {
    if (loading) {
        return <div className="pc3-grid" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="pc3-skel" />)}</div>;
    }
    if (!products.length) return <p style={{ textAlign: 'center' }}>Products are coming soon.</p>;
    return <div className="pc3-grid">{products.map((p) => <Carousel key={p.slug || p.name} p={p} />)}</div>;
}