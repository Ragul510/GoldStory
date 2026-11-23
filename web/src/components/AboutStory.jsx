import { useEffect, useRef, useState } from 'react';
import useReveal from './useReveal';
import './AboutTrust.css';

/* Spinning gold coin with the brand logo. three.js is loaded only when the coin scrolls into view. */
function startCoin(THREE, canvas, reduce) {
    let R;
    try { R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return null; }
    R.setPixelRatio(Math.min(devicePixelRatio, 2));
    R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.15;
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    cam.position.z = 4;
    const trash = []; const keep = (o) => { trash.push(o); return o; };

    { // studio environment for gold reflections
        const e = document.createElement('canvas'); e.width = 1024; e.height = 512;
        const x = e.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, '#3a2a18'); g.addColorStop(0.5, '#120d08'); g.addColorStop(1, '#2a1d10');
        x.fillStyle = g; x.fillRect(0, 0, 1024, 512); x.fillStyle = '#fff4dc';
        [[120, 90, 170, 200], [430, 60, 190, 120], [760, 100, 150, 220], [600, 330, 260, 50]].forEach((b) => x.fillRect(...b));
        x.fillStyle = '#ffd58a'; x.fillRect(900, 40, 60, 300);
        const t = keep(new THREE.CanvasTexture(e)); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
        const pm = new THREE.PMREMGenerator(R); sc.environment = keep(pm.fromEquirectangular(t).texture); pm.dispose();
    }
    const key = new THREE.DirectionalLight(0xffe2b0, 1.2); key.position.set(3, 4, 5); sc.add(key);

    const col = new THREE.Color(0xd9a548); // 22K gold
    const gold = keep(new THREE.MeshStandardMaterial({ color: col, metalness: 1, roughness: 0.22, envMapIntensity: 1.3 }));
    const cc = document.createElement('canvas'); cc.width = cc.height = 1024;
    {
        const x = cc.getContext('2d'), C = 512;
        x.fillStyle = '#fff'; x.fillRect(0, 0, 1024, 1024);
        x.strokeStyle = '#9a9a9a'; x.lineWidth = 14; x.beginPath(); x.arc(C, C, 486, 0, 7); x.stroke();
        x.setLineDash([3, 13]); x.lineWidth = 10; x.strokeStyle = '#bdbdbd'; x.beginPath(); x.arc(C, C, 462, 0, 7); x.stroke(); x.setLineDash([]);
        x.strokeStyle = '#8c8c8c'; x.lineWidth = 6; x.beginPath(); x.arc(C, C, 300, 0, 7); x.stroke();
        const txt = 'THE GOLD STORY \u2022 MADE TO ORDER \u2022 ', n = txt.length;
        x.font = '700 74px Georgia,serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + ((i + 0.5) / n) * Math.PI * 2;
            x.save(); x.translate(C + Math.cos(a) * 382, C + Math.sin(a) * 382); x.rotate(a + Math.PI / 2);
            x.fillStyle = '#fff'; x.fillText(txt[i], 3, 3); x.fillStyle = '#4a4a4a'; x.fillText(txt[i], 0, 0); x.restore();
        }
        [['#fff', 5], ['#444', 0]].forEach(([c, o]) => { // logo: gold "C" ring + sparkle
            x.save(); x.translate(o, o); x.strokeStyle = c; x.fillStyle = c; x.lineCap = 'round'; x.lineWidth = 46;
            x.beginPath(); x.arc(C - 8, C + 10, 135, -0.3, Math.PI * 2 - 1.3); x.stroke();
            const sx = C + 98, sy = C - 108, r = 64;
            x.beginPath(); x.moveTo(sx, sy - r); x.quadraticCurveTo(sx + 8, sy - 8, sx + r, sy); x.quadraticCurveTo(sx + 8, sy + 8, sx, sy + r);
            x.quadraticCurveTo(sx - 8, sy + 8, sx - r, sy); x.quadraticCurveTo(sx - 8, sy - 8, sx, sy - r); x.fill(); x.restore();
        });
    }
    const ct = keep(new THREE.CanvasTexture(cc)); ct.anisotropy = 8; ct.colorSpace = THREE.SRGBColorSpace;
    const faceMat = keep(new THREE.MeshStandardMaterial({ color: col, map: ct, metalness: 1, roughness: 0.3, envMapIntensity: 1.3 }));
    const K = new THREE.Group();
    const body = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 96)), gold); body.rotation.x = Math.PI / 2; K.add(body);
    const fg = keep(new THREE.CircleGeometry(0.68, 64)), rg = keep(new THREE.TorusGeometry(0.685, 0.035, 10, 96));
    [1, -1].forEach((s) => {
        const f = new THREE.Mesh(fg, faceMat); f.position.z = s * 0.052; if (s < 0) f.rotation.y = Math.PI; K.add(f);
        const r = new THREE.Mesh(rg, gold); r.position.z = s * 0.05; K.add(r);
    });
    K.scale.setScalar(1.4); sc.add(K);

    const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    addEventListener('resize', size); size();
    let vis = true, alive = true, raf = 0;
    const vio = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }); vio.observe(canvas);
    const clk = new THREE.Clock();
    const frame = () => {
        if (!alive) return;
        raf = requestAnimationFrame(frame);
        if (!vis) return;
        const t = clk.getElapsedTime();
        K.rotation.set(0.18 + Math.sin(t * 0.7) * 0.06, reduce ? 0.5 : t * 0.8, 0);
        K.position.y = reduce ? 0 : Math.sin(t * 1.2) * 0.04;
        R.render(sc, cam);
    };
    frame();
    return () => { alive = false; cancelAnimationFrame(raf); vio.disconnect(); removeEventListener('resize', size); trash.forEach((o) => o.dispose?.()); R.dispose(); };
}

function LogoCoin() {
    const cv = useRef(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        const canvas = cv.current; if (!canvas) return undefined;
        let dead = false, stop = () => { };
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const io = new IntersectionObserver(async ([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            const THREE = await import('three');
            if (dead) return;
            const s = startCoin(THREE, canvas, reduce);
            if (s) stop = s; else setFailed(true);
        }, { threshold: 0.1 });
        io.observe(canvas);
        return () => { dead = true; io.disconnect(); stop(); };
    }, []);
    return (
        <div className="abx-coin rv" style={{ '--i': 2 }}>
            {failed
                ? <img src="/images/coin.jpg" alt="Personalized gold coin" width={600} height={600} loading="lazy" />
                : <canvas ref={cv} role="img" aria-label="Spinning gold coin with The Gold Story logo" />}
        </div>
    );
}

export default function AboutStory() {
    const [ref, inView] = useReveal();
    return (
        <div className={`abx rvs${inView ? ' in' : ''}`} ref={ref}>
            <div className="abx-grid">
                <div>
                    <p className="abx-k rv">Our story</p>
                    <h2 className="rv" style={{ '--i': 1 }}>About The Gold Story</h2>
                    <p className="abx-p rv" style={{ '--i': 2 }}>
                        The Gold Story makes personalized 18K, 22K and 24K gold bracelets, rings and coins, each one made to order around <mark>your name</mark>, initials or <mark>your own design</mark>.
                    </p>
                    <p className="abx-p rv" style={{ '--i': 3 }}>You preview it, confirm it, and we make it after design review.</p>
                    <div className="abx-chips rv" style={{ '--i': 4 }}>
                        <span>18K · 22K · 24K</span><span>Made to order</span><span>Preview &amp; confirm first</span>
                    </div>
                </div>
                <LogoCoin />
            </div>
        </div>
    );
}