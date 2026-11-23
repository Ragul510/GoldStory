import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import './Hero3D.css';

// 18K is paler, 22K deeper, 24K brightest. Purity is the gold content of each karat.
export const KARATS = {
    18: { hex: 0xe2c27c, purity: '75.0%', note: 'Lighter, more durable everyday gold' },
    22: { hex: 0xd9a548, purity: '91.6%', note: 'Rich, warm traditional gold' },
    24: { hex: 0xffc93c, purity: '99.9%', note: 'Purest gold, deepest shine' },
};
const SERIF = "Georgia,'Times New Roman',serif";

function createScene(canvas, wrap, panels, hint) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(devicePixelRatio, 2));
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.15;
    const sc = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.z = 6;
    const disposables = [];
    const track = (o) => { disposables.push(o); return o; };

    // Studio environment (dark room with soft boxes) for gold reflections
    {
        const e = document.createElement('canvas');
        e.width = 1024; e.height = 512;
        const x = e.getContext('2d');
        const g = x.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, '#3a2a18'); g.addColorStop(0.5, '#120d08'); g.addColorStop(1, '#2a1d10');
        x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
        x.fillStyle = '#fff4dc';
        [[120, 90, 170, 200], [430, 60, 190, 120], [760, 100, 150, 220], [600, 330, 260, 50]].forEach((b) => x.fillRect(...b));
        x.fillStyle = '#ffd58a'; x.fillRect(900, 40, 60, 300);
        const t = track(new THREE.CanvasTexture(e));
        t.mapping = THREE.EquirectangularReflectionMapping;
        t.colorSpace = THREE.SRGBColorSpace;
        const p = new THREE.PMREMGenerator(R);
        sc.environment = track(p.fromEquirectangular(t).texture);
        p.dispose();
    }
    const key = new THREE.DirectionalLight(0xffe2b0, 1.2);
    key.position.set(3, 4, 5);
    sc.add(key);

    const kc = new THREE.Color(KARATS[22].hex), kt = kc.clone();
    const mat = (extra = {}) => track(new THREE.MeshStandardMaterial({ color: kc.clone(), metalness: 1, roughness: 0.22, envMapIntensity: 1.3, ...extra }));
    const mats = [];
    const gold = mat(); mats.push(gold);
    const tex = (c) => { const t = track(new THREE.CanvasTexture(c)); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t; };

    // Name plate texture
    let name = 'Aarav', shown = 0, lastT = 0, delay = 1100;
    const pc = document.createElement('canvas'); pc.width = 1024; pc.height = 320;
    const px = pc.getContext('2d'); const ptex = tex(pc);
    const drawPlate = () => {
        px.fillStyle = '#fff'; px.fillRect(0, 0, 1024, 320);
        px.strokeStyle = '#8a8a8a'; px.lineWidth = 5; px.strokeRect(20, 20, 984, 280);
        px.strokeStyle = '#d0d0d0'; px.lineWidth = 2; px.strokeRect(34, 34, 956, 252);
        const full = name.toUpperCase(), sp = 14;
        let sz = 150;
        px.textBaseline = 'middle';
        const measure = () => { px.font = `600 ${sz}px ${SERIF}`; let t = 0; for (const ch of full) t += px.measureText(ch).width + sp; return t - sp; };
        let tot = measure();
        if (tot > 880) { sz = Math.floor(150 * 880 / tot); tot = measure(); }
        let cx = 512 - tot / 2;
        for (let i = 0; i < full.length; i++) {
            const ch = full[i];
            if (i < shown) {
                px.fillStyle = '#fff'; px.fillText(ch, cx + 3, 169);
                px.fillStyle = i === shown - 1 && shown < full.length ? '#fff' : '#3d3d3d'; px.fillText(ch, cx, 166);
            }
            cx += px.measureText(ch).width + sp;
        }
        ptex.needsUpdate = true;
    };
    const ic = document.createElement('canvas'); ic.width = ic.height = 256;
    const ix = ic.getContext('2d'); const itex = tex(ic);
    const drawInitial = () => {
        ix.fillStyle = '#fff'; ix.fillRect(0, 0, 256, 256);
        ix.fillStyle = '#3d3d3d'; ix.font = `600 170px ${SERIF}`; ix.textAlign = 'center'; ix.textBaseline = 'middle';
        ix.fillText((name[0] || 'G').toUpperCase(), 128, 138);
        itex.needsUpdate = true;
    };

    // Bracelet
    const B = new THREE.Group(), RAD = 1.3, N = 34;
    const lg = track(new THREE.TorusGeometry(0.16, 0.05, 14, 28));
    for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const d = Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d < 0.46) continue;
        const m = new THREE.Mesh(lg, gold);
        m.scale.x = 1.35; m.rotation.order = 'ZXY';
        m.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, a + Math.PI / 2);
        m.position.set(Math.cos(a) * RAD, Math.sin(a) * RAD, 0);
        B.add(m);
    }
    const front = mat({ map: ptex, roughness: 0.3 }); mats.push(front);
    const plate = new THREE.Mesh(track(new THREE.BoxGeometry(0.95, 0.3, 0.07)), [gold, gold, gold, gold, front, gold]);
    plate.position.set(0, RAD, 0); B.add(plate);
    const cg = track(new THREE.TorusGeometry(0.07, 0.028, 10, 20));
    [-1, 1].forEach((s) => { const c = new THREE.Mesh(cg, gold); c.position.set(s * 0.52, RAD, 0); c.rotation.y = Math.PI / 2; B.add(c); });
    sc.add(B);

    // Ring with initial on the signet
    const G = new THREE.Group();
    G.add(new THREE.Mesh(track(new THREE.TorusGeometry(0.75, 0.14, 28, 80)), gold));
    const sg = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 56)), gold);
    sg.rotation.x = Math.PI / 2; sg.position.set(0, 0.84, 0); G.add(sg);
    const faceMat = mat({ map: itex, roughness: 0.3 }); mats.push(faceMat);
    const face = new THREE.Mesh(track(new THREE.CircleGeometry(0.36, 48)), faceMat);
    face.position.set(0, 0.84, 0.085); G.add(face);
    sc.add(G);

    // Coin with the brand logo (gold "C" ring + sparkle). Replace drawCoin to use your own logo image.
    const cc = document.createElement('canvas'); cc.width = cc.height = 1024;
    const ctex = tex(cc);
    const drawCoin = () => {
        const x = cc.getContext('2d'), C = 512;
        x.setLineDash([]); x.fillStyle = '#fff'; x.fillRect(0, 0, 1024, 1024);
        x.strokeStyle = '#9a9a9a'; x.lineWidth = 14; x.beginPath(); x.arc(C, C, 486, 0, 7); x.stroke();
        x.setLineDash([3, 13]); x.lineWidth = 10; x.strokeStyle = '#bdbdbd'; x.beginPath(); x.arc(C, C, 462, 0, 7); x.stroke(); x.setLineDash([]);
        x.strokeStyle = '#8c8c8c'; x.lineWidth = 6; x.beginPath(); x.arc(C, C, 300, 0, 7); x.stroke();
        const txt = 'THE GOLD STORY \u2022 MADE TO ORDER \u2022 ', n = txt.length;
        x.font = `700 74px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + ((i + 0.5) / n) * Math.PI * 2;
            x.save(); x.translate(C + Math.cos(a) * 382, C + Math.sin(a) * 382); x.rotate(a + Math.PI / 2);
            x.fillStyle = '#fff'; x.fillText(txt[i], 3, 3); x.fillStyle = '#4a4a4a'; x.fillText(txt[i], 0, 0); x.restore();
        }
        [['#fff', 5], ['#444', 0]].forEach(([c, o]) => {
            x.save(); x.translate(o, o); x.strokeStyle = c; x.fillStyle = c; x.lineCap = 'round'; x.lineWidth = 46;
            x.beginPath(); x.arc(C - 8, C + 10, 135, -0.3, Math.PI * 2 - 1.3); x.stroke();
            const sx = C + 98, sy = C - 108, r = 64;
            x.beginPath(); x.moveTo(sx, sy - r);
            x.quadraticCurveTo(sx + 8, sy - 8, sx + r, sy); x.quadraticCurveTo(sx + 8, sy + 8, sx, sy + r);
            x.quadraticCurveTo(sx - 8, sy + 8, sx - r, sy); x.quadraticCurveTo(sx - 8, sy - 8, sx, sy - r);
            x.fill(); x.restore();
        });
        ctex.needsUpdate = true;
    };
    const cmat = mat({ map: ctex, roughness: 0.3 }); mats.push(cmat);
    const K = new THREE.Group();
    const body = new THREE.Mesh(track(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 96)), gold);
    body.rotation.x = Math.PI / 2; K.add(body);
    const fg = track(new THREE.CircleGeometry(0.68, 64)), rg = track(new THREE.TorusGeometry(0.685, 0.035, 10, 96));
    [1, -1].forEach((s) => {
        const f = new THREE.Mesh(fg, cmat); f.position.z = s * 0.052; if (s < 0) f.rotation.y = Math.PI; K.add(f);
        const r = new THREE.Mesh(rg, gold); r.position.z = s * 0.05; K.add(r);
    });
    sc.add(K);

    // Gold dust
    const NP = 260, pa = new Float32Array(NP * 3), pv = [];
    for (let i = 0; i < NP; i++) {
        pa[i * 3] = (Math.random() - 0.5) * 14; pa[i * 3 + 1] = (Math.random() - 0.5) * 9; pa[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
        pv.push(0.1 + Math.random() * 0.25);
    }
    const pg = track(new THREE.BufferGeometry());
    pg.setAttribute('position', new THREE.BufferAttribute(pa, 3));
    const dust = new THREE.Points(pg, track(new THREE.PointsMaterial({ color: 0xf1d48f, size: 0.035, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })));
    sc.add(dust);

    // Scroll keyframes: bracelet (b), ring (g), coin (k)
    let T = [];
    const build = () => {
        const w = innerWidth > 800 ? 1 : 0, m = w ? 1 : 0.62;
        T = [
            { bx: 1.5 * w, by: w ? 0 : 0.9, bs: m, rx: -0.5, ry: 0, amp: 0.7, gx: 0, gy: 0, gs: 0, kx: 3.1 * w, ky: -1.6, kz: w ? 0.75 : 0 },
            { bx: 0, by: -3.38 * m, bs: 2.6 * m, rx: -0.12, ry: 0, amp: 0, gx: 0, gy: 0, gs: 0, kx: 0, ky: 0, kz: 0 },
            { bx: 0, by: -0.2, bs: 1.35 * m, rx: -0.5, ry: 0.2, amp: 0.5, gx: 0, gy: 0, gs: 0, kx: 0, ky: 0, kz: 0 },
            { bx: -3 * w, by: w ? 0 : 1.8, bs: w ? 0.55 : 0.4, rx: -0.5, ry: 0.3, amp: 0.3, gx: 0, gy: w ? 0 : 0.4, gs: w ? 1.2 : 0.7, kx: 3 * w, ky: w ? 0 : -0.9, kz: w ? 1 : 0.5 },
            { bx: -2.9 * w, by: w ? 0.2 : 1.9, bs: w ? 0.6 : 0.4, rx: -0.5, ry: 0.3, amp: 0.4, gx: 0, gy: w ? 0.2 : 0.6, gs: w ? 1 : 0.6, kx: 2.9 * w, ky: w ? 0.2 : -0.5, kz: w ? 0.9 : 0.4 },
        ];
    };
    const size = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); build();
    };
    addEventListener('resize', size); size();

    const cur = { bx: 0, by: 0, bs: 1, rx: -0.5, ry: 0, amp: 0.7, gx: 0, gy: 0, gs: 0, kx: 0, ky: 0, kz: 0 };
    const keys = Object.keys(cur);
    const smooth = (f) => f * f * (3 - 2 * f);

    const replay = (fast) => { shown = reduce ? name.length : 0; lastT = performance.now(); delay = fast ? 150 : 1100; };
    const redraw = () => { drawPlate(); drawInitial(); drawCoin(); };
    redraw(); replay(false);
    document.fonts?.ready.then(redraw);

    const clock = new THREE.Clock();
    let raf = 0, alive = true;
    const frame = () => {
        if (!alive) return;
        raf = requestAnimationFrame(frame);
        const rect = wrap.getBoundingClientRect(), vh = innerHeight;
        if (rect.bottom < 0 || rect.top > vh) return; // off-screen: skip rendering
        const t = clock.getElapsedTime();
        const s = Math.min(4, Math.max(0, -rect.top / vh));
        const i = Math.min(3, Math.floor(s)), f = smooth(s - i);
        keys.forEach((k) => { cur[k] += (T[i][k] + (T[i + 1][k] - T[i][k]) * f - cur[k]) * (reduce ? 1 : 0.07); });
        const spin = reduce ? 0 : Math.sin(t * 0.6) * cur.amp;
        B.position.set(cur.bx, cur.by, 0); B.scale.setScalar(cur.bs); B.rotation.set(cur.rx, cur.ry + spin, 0);
        G.position.set(cur.gx, cur.gy, 0); G.scale.setScalar(Math.max(cur.gs, 0.0001)); G.visible = cur.gs > 0.01; G.rotation.set(0.25, reduce ? 0.4 : t * 0.7, 0);
        K.position.set(cur.kx, cur.ky, 0); K.scale.setScalar(Math.max(cur.kz, 0.0001)); K.visible = cur.kz > 0.01; K.rotation.set(0.1, reduce ? 0.5 : t * 0.9, 0);
        kc.lerp(kt, 0.08); mats.forEach((m) => m.color.copy(kc));
        const n = performance.now();
        if (shown < name.length && n - lastT > delay) { shown++; lastT = n; delay = 170; drawPlate(); }
        if (!reduce) {
            const p = pg.attributes.position;
            for (let j = 0; j < NP; j++) { let y = p.array[j * 3 + 1] + pv[j] * 0.004 * (1 + s); if (y > 4.5) y = -4.5; p.array[j * 3 + 1] = y; }
            p.needsUpdate = true;
        }
        dust.rotation.y = s * 0.15;
        R.render(sc, cam);
        panels.forEach((el, k) => {
            if (!el) return;
            const o = Math.max(0, 1 - Math.abs(s - k) * 2.2);
            el.style.opacity = o; el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
            el.style.transform = `translateY(${-(s - k) * 40}px)`;
        });
        if (hint) hint.style.opacity = s > 0.05 ? 0 : 1;
    };
    frame();

    return {
        setName(v) { const nv = v.trim() || 'Gold'; if (nv === name) return; name = nv; replay(true); drawInitial(); },
        setKarat(k) { kt.set(KARATS[k].hex); },
        dispose() {
            alive = false; cancelAnimationFrame(raf); removeEventListener('resize', size);
            disposables.forEach((d) => d.dispose?.()); R.dispose();
        },
    };
}

export default function Hero3D() {
    const wrap = useRef(null), cv = useRef(null), hint = useRef(null), panels = useRef([]), api = useRef(null);
    const [name, setName] = useState('Aarav');
    const [karat, setKarat] = useState(22);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        try { api.current = createScene(cv.current, wrap.current, panels.current, hint.current); }
        catch { setFailed(true); return undefined; }
        return () => api.current?.dispose();
    }, []);
    useEffect(() => { api.current?.setName(name); }, [name]);
    useEffect(() => { api.current?.setKarat(karat); }, [karat]);

    const Orn = () => (
        <svg className="h3d-orn" viewBox="0 0 130 16" width="130" height="16" aria-hidden="true">
            <path d="M10 8h42M78 8h42" stroke="#d8b46a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M65 2l6 6-6 6-6-6z" fill="#d8b46a" />
        </svg>
    );

    // No WebGL: show the original image hero
    if (failed) {
        return (
            <div className="frame"><div className="scene">
                <div className="hc">
                    <h1>Your Name. Your Design. Your Gold.</h1>
                    <p>Create personalized 18K, 22K and 24K gold jewellery crafted around your identity.</p>
                    <div className="cta">
                        <Link className="btn" to="/studio">Customize Now</Link>
                        <Link className="btn o" to="/#cats">Explore Bracelets &amp; Rings</Link>
                    </div>
                </div>
                <div className="hv2">
                    <div className="tile bk"><img src="/images/bracelet.jpg" alt="Gold curb-link bracelet with engraved name plate" width={800} height={800} /></div>
                    <div className="tile"><img src="/images/coin.jpg" alt="Personalized gold coin" width={800} height={800} loading="lazy" /></div>
                </div>
            </div></div>
        );
    }

    const ref = (i) => (el) => { panels.current[i] = el; };
    return (
        <section className="h3d" ref={wrap} aria-label="Personalized gold jewellery">
            <div className="h3d-stick">
                <canvas ref={cv} className="h3d-cv" aria-hidden="true" />

                <div className="h3d-p left hero" ref={ref(0)} style={{ opacity: 1 }}><div>
                    <p className="h3d-k">18K · 22K · 24K · Made to order</p>
                    <h1>Your Name. Your Design. <em>Your Gold.</em></h1>
                    <Orn />
                    <p className="h3d-t">Create personalized 18K, 22K and 24K gold jewellery crafted around your identity.</p>
                    <div className="h3d-cta">
                        <Link className="h3d-btn" to="/studio">Customize Now</Link>
                        <Link className="h3d-btn o" to="/#cats">Explore Bracelets &amp; Rings</Link>
                    </div>
                </div></div>

                <div className="h3d-p top mid" ref={ref(1)}>
                    <p className="h3d-k">Engraved for you</p>
                    <h2>Type your name.<br /><em>Watch it turn to gold.</em></h2>
                    <label className="h3d-nm">
                        <input value={name} maxLength={12} spellCheck={false} aria-label="Your name" onChange={(e) => setName(e.target.value)} />
                        <span>Live</span>
                    </label>
                </div>

                <div className="h3d-p bot mid" ref={ref(2)}>
                    <p className="h3d-k">Choose your purity</p>
                    <h2>18K, 22K or <em>24K gold.</em></h2>
                    <div className="h3d-tg" role="group" aria-label="Gold purity">
                        {Object.keys(KARATS).map((k) => (
                            <button key={k} type="button" className={+k === karat ? 'on' : ''} aria-pressed={+k === karat} onClick={() => setKarat(+k)}>{k}K</button>
                        ))}
                    </div>
                    <p className="h3d-t h3d-note">{karat}K · {KARATS[karat].purity} pure gold. {KARATS[karat].note}.</p>
                </div>

                <div className="h3d-p left" ref={ref(3)}><div>
                    <p className="h3d-k">The collection</p>
                    <h2>Bracelets, Rings <em>&amp; Coins</em></h2>
                    <p className="h3d-t">Three pieces, endlessly personal. Your name, initials or logo, made to order in the gold you choose.</p>
                    <div className="h3d-cta"><Link className="h3d-btn o" to="/#cats">Explore the collection</Link></div>
                </div></div>

                <div className="h3d-p mid bot" ref={ref(4)}>
                    <h2>Begin <em>your story</em></h2>
                    <p className="h3d-t">Design it in minutes. Wear it for generations.</p>
                    <div className="h3d-cta"><Link className="h3d-btn" to="/studio">Customize Now</Link></div>
                </div>

                <div className="h3d-hint" ref={hint}>Scroll</div>
            </div>
        </section>
    );
}
