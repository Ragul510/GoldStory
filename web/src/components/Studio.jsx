import { useEffect, useState } from 'react';
import { media } from '../lib/api';
import { getQuote, uploadArtwork, createOrder } from '../services/api';
const FONTS = { Classic: "'Instrument Serif',Georgia,serif", Script: "'Great Vibes',cursive", Modern: 'Inter,system-ui,sans-serif', Serif: 'Georgia,serif' };
const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export default function Studio({ products }) {
    const live = products.filter((p) => p.status === 'fulfilled');
    const [slug, setSlug] = useState(live[0]?.slug ?? '');
    const p = live.find((x) => x.slug === slug) ?? live[0];
    const [purity, setPurity] = useState('22K');
    const [mode, setMode] = useState('text');
    const [text, setText] = useState('');
    const [font, setFont] = useState('Classic');
    const [art, setArt] = useState(null);
    const [artErr, setArtErr] = useState('');
    const [view, setView] = useState('photo');
    const [idx, setIdx] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [quote, setQuote] = useState(null);
    const [qMsg, setQMsg] = useState('');
    const [form, setForm] = useState({ name: '', mobile: '', email: '', address: '' });
    const [ok, setOk] = useState(false);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(null);
    useEffect(() => { const q = new URLSearchParams(location.search).get('product'); if (q && live.some((x) => x.slug === q))
        setSlug(q); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!p)
            return;
        if (!p.purities.includes(purity))
            setPurity(p.purities[0]);
        setText((t) => t.slice(0, p.maxChars));
        setIdx(0);
        setView('photo');
    }, [p?.slug]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!p)
            return;
        let stop = false;
        setQuote(null);
        setQMsg('');
        getQuote(p.slug, purity)
            .then(({ ok: good, data: j }) => { if (stop)
            return; good ? setQuote(j) : setQMsg(j.error === 'rates_not_set' ? 'The estimate appears once the jeweller sets the rate.' : 'No estimate available for this choice.'); })
            .catch(() => !stop && setQMsg('Could not load the estimate.'));
        return () => { stop = true; };
    }, [p?.slug, purity]); // eslint-disable-line react-hooks/exhaustive-deps
    if (!p)
        return <div className="w studio"><div className="pn"><h3>No pieces available yet</h3><p className="note">New pieces are coming soon. Please check back shortly.</p></div></div>;
    async function upload(f) {
        setArtErr('');
        if (!f)
            return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type))
            return setArtErr('Please upload a PNG, JPG or WebP image.');
        if (f.size > 2 * 1024 * 1024)
            return setArtErr('File is larger than 2 MB.');
        const fd = new FormData();
        fd.append('file', f);
        try {
            const { ok: fine, data: j } = await uploadArtwork(f);
            if (!fine)
                return setArtErr(j.error || 'Upload failed.');
            setArt({ file: j.file, url: URL.createObjectURL(f) });
        }
        catch {
            setArtErr('Upload failed.');
        }
    }
    async function order() {
        setErr('');
        const f = form;
        if (mode === 'text' && !text.trim())
            return setErr('Enter a name or initials first.');
        if (mode === 'img' && !art)
            return setErr('Upload a design first.');
        if (!quote)
            return setErr('A price estimate is needed before ordering. The jeweller has not set the gold rate yet.');
        if (f.name.trim().length < 2)
            return setErr('Enter your name.');
        if (!/^[6-9]\d{9}$/.test(f.mobile))
            return setErr('Enter a valid 10-digit mobile number.');
        if (f.address.trim().length < 10)
            return setErr('Enter a full shipping address.');
        if (!ok)
            return setErr('Please confirm the design.');
        setBusy(true);
        try {
            const { ok: good, data: j } = await createOrder({ slug: p.slug, purity, text: mode === 'text' ? text.trim() : '', font, artworkFile: mode === 'img' ? art?.file : undefined, customer: { name: f.name.trim(), mobile: f.mobile, email: f.email, address: f.address.trim() } });
            good ? setDone({ id: j.id, note: j.note }) : setErr(j.error || 'Could not place the order.');
        }
        catch {
            setErr('Network error. Please try again.');
        }
        setBusy(false);
    }
    const e = p.engrave, shown = mode === 'text' ? text : '';
    const fs = Math.min(e.h * 0.8, e.w / (Math.max(shown.length, 1) * (font === 'Script' ? 0.4 : font === 'Modern' ? 0.78 : 0.6)));
    const img = p.images[idx] ?? p.images[0];
    return (<div className="w studio">
      <div>
        <div className="pn"><h3>1 · Choose jewellery</h3>
          <div className="opt">{live.map((x) => <button key={x.slug} className={`chip${x.slug === p.slug ? ' on' : ''}`} onClick={() => setSlug(x.slug)}>{x.name}</button>)}</div></div>
        <div className="pn"><h3>2 · Gold purity</h3>
          <div className="opt">{['22K', '24K'].map((k) => <button key={k} className={`chip${purity === k ? ' on' : ''}`} disabled={!p.purities.includes(k)} onClick={() => setPurity(k)}>{k} · {k === '22K' ? '91.6%' : '99.9%'}</button>)}</div>
          <p className="note">{!p.purities.includes('24K') ? '24K is too soft for this design, so it is not offered.' : purity === '24K' ? '24K is very soft; this design may need a different construction. We confirm before production.' : '22K is the durable choice for everyday wear.'}</p>
          <p className="note">Final material and price are confirmed before production.</p></div>
        <div className="pn"><h3>3 · Personalize</h3>
          <div className="opt"><button className={`chip${mode === 'text' ? ' on' : ''}`} onClick={() => setMode('text')}>Enter name</button><button className={`chip${mode === 'img' ? ' on' : ''}`} onClick={() => setMode('img')}>Upload design</button></div>
          {mode === 'text' ? (<>
            <label htmlFor="nm">Name, initials or numbers ({p.maxChars} max)</label>
            <input id="nm" type="text" value={text} maxLength={p.maxChars} autoComplete="off" onChange={(ev) => setText(ev.target.value)}/>
            <label>Lettering style</label>
            <div className="opt">{Object.keys(FONTS).map((f) => <button key={f} className={`chip${font === f ? ' on' : ''}`} style={{ fontFamily: FONTS[f] }} onClick={() => setFont(f)}>{f}</button>)}</div>
          </>) : (<>
            <label htmlFor="lg">PNG, JPG or WebP · max 2 MB</label>
            <input id="lg" type="file" accept="image/png,image/jpeg,image/webp" onChange={(ev) => upload(ev.target.files?.[0])}/>
            {artErr && <div className="err">{artErr}</div>}
            {art && <div><img className="thumb" src={art.url} alt="Your uploaded design"/> <button className="chip" onClick={() => setArt(null)}>Remove</button></div>}
          </>)}</div>
      </div>

      <div className="pv">
        <div className="stage" style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', containerType: 'inline-size', display: 'block' }}>
          {view === 'video' && p.video ? (<video src={media(p.video)} controls loop muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>) : (<div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transition: 'transform .3s' }}>
              {img && <img src={media(img)} alt={`${p.name} preview`} fetchPriority="high" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}/>}
              {idx === 0 && (shown || (mode === 'img' && art)) && (<div style={{ position: 'absolute', left: `${e.cx}%`, top: `${e.cy}%`, width: `${e.w}%`, height: `${e.h}%`, transform: `translate(-50%,-50%) rotate(${e.rot}deg)`, display: 'grid', placeItems: 'center' }}>
                  {mode === 'text'
                    ? <span style={{ fontFamily: FONTS[font], fontSize: `${fs}cqw`, lineHeight: 1, whiteSpace: 'nowrap', color: '#2a1a02', textShadow: '0 1px 0 rgba(255,255,255,.35)', textTransform: font === 'Modern' ? 'uppercase' : 'none', letterSpacing: font === 'Modern' ? '.14em' : 0 }}>{shown}</span>
                    : art && <img src={art.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.85 }}/>}
                </div>)}
            </div>)}
        </div>
        <div className="tools">
          <button className="chip" onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))} aria-label="Zoom in">＋</button>
          <button className="chip" onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))} aria-label="Zoom out">－</button>
          {p.video && <button className={`chip${view === 'video' ? ' on' : ''}`} onClick={() => setView(view === 'video' ? 'photo' : 'video')}>360° video</button>}
          <button className="chip" onClick={() => { setText(''); setArt(null); setZoom(1); setFont('Classic'); setMode('text'); setIdx(0); setView('photo'); }}>Reset design</button>
        </div>
        {p.images.length > 1 && <div className="strip" style={{ gridTemplateColumns: `repeat(${Math.min(p.images.length, 8)},1fr)` }}>{p.images.map((u, i) => <button key={u} onClick={() => { setIdx(i); setView('photo'); }} aria-label={`View ${i + 1}`} style={{ border: 0, padding: 0, background: 'none' }}><img src={media(u)} alt="" width={96} height={96} loading="lazy" style={{ width: '100%', height: 'auto', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, outline: i === idx ? '2px solid #3f6fb0' : 'none' }}/></button>)}</div>}
        <p className="disc">Preview only. The manufactured piece may differ slightly in finish, proportion and engraving depth. Our jeweller reviews every design before production.</p>

        <div className="pn" style={{ marginTop: 16 }}>
          <h3>Price estimate</h3>
          {quote ? (<table><tbody>
              <tr><td>Estimated weight</td><td>{quote.weight} g</td></tr>
              <tr><td>{purity} gold @ {inr(quote.rate)}/g</td><td>{inr(quote.gold)}</td></tr>
              <tr><td>Making</td><td>{inr(quote.making)}</td></tr>
              <tr><td>Tax</td><td>{inr(quote.tax)}</td></tr>
              <tr><td>Shipping</td><td>{inr(quote.shipping)}</td></tr>
              <tr className="tot"><td>Estimated total</td><td>{inr(quote.total)}</td></tr>
            </tbody></table>) : <p className="note warn">{qMsg || 'Loading estimate…'}</p>}
          <p className="note">Estimate only, until final design, weight and gold rate are confirmed. The price is always recalculated on our server.</p>

          {done ? (<div><h3>Order received</h3><p>Order ID <b>{done.id}</b></p><p className="note">{done.note}</p></div>) : (<>
            <label htmlFor="cn">Full name</label><input id="cn" type="text" autoComplete="name" value={form.name} onChange={(ev) => setForm({ ...form, name: ev.target.value })}/>
            <label htmlFor="cm">Mobile</label><input id="cm" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={form.mobile} onChange={(ev) => setForm({ ...form, mobile: ev.target.value.replace(/\D/g, '') })}/>
            <label htmlFor="ce">Email (optional)</label><input id="ce" type="email" autoComplete="email" value={form.email} onChange={(ev) => setForm({ ...form, email: ev.target.value })}/>
            <label htmlFor="ca">Shipping address</label><textarea id="ca" rows={3} autoComplete="street-address" value={form.address} onChange={(ev) => setForm({ ...form, address: ev.target.value })}/>
            <label><input type="checkbox" checked={ok} onChange={(ev) => setOk(ev.target.checked)}/> I have reviewed and confirm this design.</label>
            {err && <div className="err" role="alert">{err}</div>}
            <p className="note warn">Test mode: no payment is taken. Live UPI needs Razorpay/Cashfree credentials and server-side webhook verification.</p>
            <button className="btn" disabled={busy} onClick={order}>{busy ? 'Placing order…' : 'Place order'}</button>
          </>)}
        </div>
      </div>
    </div>);
}
