import { useEffect, useMemo, useState } from 'react';
import { media } from '../../lib/api';
import { adminSaveProduct } from '../../services/api';
const MAX_IMG = 8 * 1024 * 1024, MAX_VID = 60 * 1024 * 1024;
const TYPES = ['bracelet', 'ring', 'coin', 'pendant', 'other'];
export default function ProductForm({ initial, onSaved, onCancel }) {
    const [f, setF] = useState({
        name: initial?.name ?? '', type: initial?.type ?? 'bracelet', description: initial?.description ?? '',
        weight: String(initial?.weightG ?? 5), maxChars: String(initial?.maxChars ?? 12),
        purities: initial?.purities ?? ['22K'], status: initial?.status ?? 'pending', isNew: initial?.isNew ?? true,
        cx: String(initial?.engrave.cx ?? 50), cy: String(initial?.engrave.cy ?? 55), w: String(initial?.engrave.w ?? 30), h: String(initial?.engrave.h ?? 8), rot: String(initial?.engrave.rot ?? 0),
    });
    const [files, setFiles] = useState([]);
    const [video, setVideo] = useState(null);
    const [remove, setRemove] = useState([]);
    const [dropVideo, setDropVideo] = useState(false);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
    const kept = (initial?.images ?? []).filter((u) => !remove.includes(u.split('/').pop()));
    const urls = useMemo(() => files.map((x) => URL.createObjectURL(x)), [files]);
    useEffect(() => () => urls.forEach(URL.revokeObjectURL), [urls]);
    const total = kept.length + files.length;
    const preview = kept[0] ? media(kept[0]) : urls[0];
    function addFiles(list) {
        if (!list)
            return;
        setErr('');
        const ok = [];
        for (const x of Array.from(list)) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(x.type)) {
                setErr(`${x.name}: use JPG, PNG or WebP`);
                continue;
            }
            if (x.size > MAX_IMG) {
                setErr(`${x.name} is larger than 8 MB`);
                continue;
            }
            ok.push(x);
        }
        const room = 8 - kept.length - files.length;
        if (ok.length > room)
            setErr(`Only ${Math.max(room, 0)} more image(s) allowed (max 8).`);
        setFiles((x) => [...x, ...ok.slice(0, Math.max(room, 0))]);
    }
    function pickVideo(x) {
        setErr('');
        if (!x)
            return;
        if (!['video/mp4', 'video/webm'].includes(x.type))
            return setErr('Video must be MP4 or WebM');
        if (x.size > MAX_VID)
            return setErr('Video is larger than 60 MB');
        setVideo(x);
    }
    async function save() {
        setErr('');
        if (f.name.trim().length < 2)
            return setErr('Enter a product name.');
        if (!f.purities.length)
            return setErr('Choose 22K, 24K or both.');
        if (!(Number(f.weight) > 0))
            return setErr('Enter the estimated weight in grams.');
        if (f.status === 'fulfilled' && total === 0)
            return setErr('Add at least one image before marking a product fulfilled.');
        const fd = new FormData();
        fd.append('name', f.name.trim());
        fd.append('type', f.type);
        fd.append('description', f.description);
        fd.append('purities', f.purities.join(','));
        fd.append('weight_g', f.weight);
        fd.append('max_chars', f.maxChars);
        fd.append('status', f.status);
        fd.append('is_new', String(f.isNew));
        fd.append('eng_cx', f.cx);
        fd.append('eng_cy', f.cy);
        fd.append('eng_w', f.w);
        fd.append('eng_h', f.h);
        fd.append('eng_rot', f.rot);
        files.forEach((x) => fd.append('images', x));
        if (video)
            fd.append('video', video);
        fd.append('removeImages', JSON.stringify(remove));
        fd.append('removeVideo', String(dropVideo));
        setBusy(true);
        try {
            await adminSaveProduct(initial ? initial.id : null, fd);
            onSaved();
        }
        catch (e) {
            setErr(e.message);
        }
        setBusy(false);
    }
    const num = (k, label) => <div><label>{label}</label><input type="number" step="0.1" value={f[k]} onChange={(e) => set(k, e.target.value)}/></div>;
    return (<div className="pn">
      <h3>{initial ? `Edit “${initial.name}”` : 'Add product'}</h3>
      <div className="pg2">
        <div><label>Product name</label><input type="text" value={f.name} maxLength={80} onChange={(e) => set('name', e.target.value)}/></div>
        <div><label>Type</label><select value={f.type} onChange={(e) => set('type', e.target.value)} style={{ width: '100%' }}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label>Estimated base weight (g)</label><input type="number" min="0.1" step="0.1" value={f.weight} onChange={(e) => set('weight', e.target.value)}/></div>
        <div><label>Max characters for name</label><input type="number" min="1" max="40" value={f.maxChars} onChange={(e) => set('maxChars', e.target.value)}/></div>
        <div><label>Status</label>
          <select value={f.status} onChange={(e) => set('status', e.target.value)} style={{ width: '100%' }}>
            <option value="pending">pending (hidden draft)</option><option value="fulfilled">fulfilled (live, orderable)</option><option value="unfulfilled">unfulfilled (shown as coming soon)</option></select></div>
        <div><label>Gold purity offered</label>
          <div className="opt">{['22K', '24K'].map((k) => <label key={k}><input type="checkbox" checked={f.purities.includes(k)} onChange={(e) => set('purities', e.target.checked ? [...f.purities, k] : f.purities.filter((x) => x !== k))}/> {k}</label>)}</div></div>
      </div>
      <label>Description</label><textarea rows={2} maxLength={1000} value={f.description} onChange={(e) => set('description', e.target.value)}/>
      <label><input type="checkbox" checked={f.isNew} onChange={(e) => set('isNew', e.target.checked)}/> Show the red “NEW” badge</label>

      <h3 style={{ marginTop: 14 }}>Images ({total}/8)</h3>
      <p className="note">Use square photos. The first image is the main one and is where the customer’s name is previewed.</p>
      <div className="opt">
        {kept.map((u) => <div key={u} style={{ position: 'relative' }}><img src={media(u)} alt="" width={72} height={72} style={{ objectFit: 'cover', borderRadius: 10 }}/><button className="chip" onClick={() => setRemove((r) => [...r, u.split('/').pop()])} aria-label="Remove image">✕</button></div>)}
        {urls.map((u, i) => <div key={u} style={{ position: 'relative' }}><img src={u} alt="" width={72} height={72} style={{ objectFit: 'cover', borderRadius: 10 }}/><button className="chip" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} aria-label="Remove new image">✕</button></div>)}
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={total >= 8} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}/>

      <h3 style={{ marginTop: 14 }}>360° video (optional)</h3>
      {initial?.video && !dropVideo && !video && <p className="note">A video is attached. <button className="chip" onClick={() => setDropVideo(true)}>Remove video</button></p>}
      {video && <p className="note">{video.name} <button className="chip" onClick={() => setVideo(null)}>✕</button></p>}
      <input type="file" accept="video/mp4,video/webm" onChange={(e) => { pickVideo(e.target.files?.[0]); e.target.value = ''; }}/>

      <h3 style={{ marginTop: 14 }}>Where the engraving appears (% of the main image)</h3>
      <div className="pg2" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>{num('cx', 'Centre X')}{num('cy', 'Centre Y')}{num('w', 'Width')}{num('h', 'Height')}{num('rot', 'Rotation °')}</div>
      {preview && (<div style={{ position: 'relative', width: 240, aspectRatio: '1', background: '#000', borderRadius: 14, overflow: 'hidden', margin: '8px 0' }}>
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
          <div style={{ position: 'absolute', left: `${f.cx}%`, top: `${f.cy}%`, width: `${f.w}%`, height: `${f.h}%`, transform: `translate(-50%,-50%) rotate(${f.rot}deg)`, border: '2px dashed #f0b400', background: 'rgba(240,180,0,.25)' }}/>
        </div>)}
      {err && <div className="err" role="alert">{err}</div>}
      <div className="opt" style={{ marginTop: 10 }}><button className="btn s" disabled={busy} onClick={save}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create product'}</button><button className="btn o s" onClick={onCancel}>Cancel</button></div>
    </div>);
}
