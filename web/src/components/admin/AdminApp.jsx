import { useCallback, useEffect, useState } from 'react';
import { media } from '../../lib/api';
import ProductForm from './ProductForm';
import { inr, ORDER_STATUSES } from './util';
import { adminDeleteProduct, adminGetRates, adminListCustomers, adminListOrders, adminListProducts, adminLogin, adminLogout, adminMe, adminSaveRates, adminSetOrderStatus, adminSetProductStatus, artworkUrl, changePasscode } from '../../services/api';
const TABS = [['products', 'Our products'], ['orders', 'Our orders'], ['customers', 'Customers'], ['rates', 'Edit rates'], ['account', 'Passcode']];
function Products() {
    const [list, setList] = useState([]);
    const [edit, setEdit] = useState(null);
    const [msg, setMsg] = useState('');
    const load = useCallback(() => adminListProducts().then(setList).catch((e) => setMsg(e.message)), []);
    useEffect(() => { load(); }, [load]);
    async function status(p, s) {
        try {
            await adminSetProductStatus(p.id, s);
            setMsg('');
            load();
        }
        catch (e) {
            setMsg(e.message);
        }
    }
    async function del(p) {
        if (!confirm(`Delete “${p.name}” and all its images? This cannot be undone.`))
            return; try {
                await adminDeleteProduct(p.id);
                load();
            }
        catch (e) {
            setMsg(e.message);
        }
    }
    if (edit)
        return <ProductForm initial={edit === 'new' ? null : edit} onCancel={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />;
    return (
        <>
            <p><button className="btn s" onClick={() => setEdit('new')}>+ Add product</button></p>
            {msg && <div className="err" role="alert">{msg}</div>}
            <div className="sc">
                <table className="tb">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Gold</th>
                            <th>Images</th>
                            <th>360°</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {list.map((p) => <tr key={p.id}>
                            <td>
                                {p.images[0] ? <img src={media(p.images[0])} alt="" width={56} height={56} style={{ objectFit: 'cover', borderRadius: 8 }} /> : '-'}</td>
                            <td>
                                <b>{p.name}</b><br /><small>{p.type} · /{p.slug}</small></td>
                            <td>{p.purities.join(' / ')}</td>
                            <td>{p.images.length}/8</td>
                            <td>{p.video ? 'Yes' : '-'}</td>
                            <td>
                                <select value={p.status} onChange={(e) => status(p, e.target.value)}><option value="pending">pending</option><option value="fulfilled">fulfilled</option><option value="unfulfilled">unfulfilled</option></select></td>
                            <td>
                                <button className="chip" onClick={() => setEdit(p)}>Edit</button>
                                <button className="chip" onClick={() => del(p)}>Delete</button>
                            </td>
                        </tr>
                        )}
                        {!list.length && <tr><td colSpan={7}>No products yet. Add your first one.</td></tr>}
                    </tbody>
                </table>
            </div>
            <p className="note">pending = hidden draft · fulfilled = live and orderable · unfulfilled = shown as “Coming soon”.</p>
        </>
    );
}

function Orders() {
    const [list, setList] = useState([]);
    const [msg, setMsg] = useState('');
    const load = useCallback(() => adminListOrders().then(setList).catch((e) => setMsg(e.message)), []);
    useEffect(() => { load(); }, [load]);
    async function st(o, s) {
        try {
            await adminSetOrderStatus(o.id, s);
            load();
        }
        catch (e) {
            setMsg(e.message);
        }
    }
    return (<>
        {msg && <div className="err" role="alert">{msg}</div>}
        <div className="sc">
            <table className="tb">
                <thead>
                    <tr>
                        <th>Order</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Item</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Artwork</th>
                    </tr>
                </thead>

                <tbody>
                    {list.map((o) => <tr key={o.id}>
                        <td><b>{o.id}</b></td>
                        <td>{o.productName} · {o.purity}<br />{o.text ? <>“{o.text}” ({o.font})</> : 'Uploaded design'}<br /><small>{o.weightG} g</small></td>
                        <td>{inr(o.pricing.total)}</td><td><small>{o.paymentStatus}</small></td>
                        <td><select value={o.status} onChange={(e) => st(o, e.target.value)}>{ORDER_STATUSES.map((s) => <option key={s} disabled={s === 'Payment Confirmed' && o.status !== s}>{s}</option>)}</select></td>
                        <td>{o.artworkFile ? <a href={artworkUrl(o.artworkFile)}>Download</a> : '-'}</td></tr>)}
                    {!list.length && <tr><td colSpan={8}>No orders yet.</td></tr>}
                </tbody>
            </table>
        </div>
        <p className="note">“Payment Confirmed” is set only by the verified payment-gateway webhook, never by hand.</p>
    </>);
}

function Customers() {
    const [list, setList] = useState([]);
    useEffect(() => {
        adminListCustomers().then(setList).catch(() => { });
    }, []);

    return
    <div className="sc">
        <table className="tb">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Orders</th>
                    <th>Value</th>
                </tr>
            </thead>

            <tbody>
                {list.map((c) => <tr key={c.mobile}>
                    <td>{c.name}</td>
                    <td>{c.mobile}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.address}</td>
                    <td>{c.orders}</td>
                    <td>{inr(c.total)}</td>
                </tr>
                )}
                {!list.length && <tr>
                    <td colSpan={6}>No customers yet.</td>
                </tr>
                }
            </tbody>
        </table>
    </div>
        ;
}

const RATE_FIELDS = [
    ['rate22', '22K rate (₹/g)'],
    ['rate24', '24K rate (₹/g)'],
    ['making', 'Making charge %'],
    ['tax', 'Tax %'],
    ['shipping', 'Shipping ₹']
];

function Rates() {
    const [r, setR] = useState({});
    const [msg, setMsg] = useState('');
    const [upd, setUpd] = useState('');

    useEffect(() => { adminGetRates().then((j) => 
        { 
            setR(Object.fromEntries(RATE_FIELDS.map(([k]) => [k, String(j[k])]))); 
            setUpd(j.updated_at || ''); }).catch((e) => 
                setMsg(e.message)); }, 
            []
        );
        
    async function save() {
        setMsg(''); try {
            const j = await adminSaveRates(r);
            setUpd(j.updated_at);
            setMsg('Saved. The site now uses these rates.');
        }
        catch (e) {
            setMsg(e.message);
        }
    }

    return (
        <div className="pn">
            <h3>Gold rates &amp; charges</h3>
            <p className="note">{upd ? `Last updated ${upd} UTC.` : 'Rates not set yet.'} Customers see estimates only after a rate is set. Prices are always calculated on the server.</p>
            <div className="pg2">{RATE_FIELDS.map(([k, l]) => 
                <div key={k}>
                    <label>{l}</label>
                    <input
                    type="number" 
                    min="0" 
                    step="any" 
                    value={r[k] ?? ''} 
                    onChange={(e) => setR({ ...r, [k]: e.target.value })} />
                </div>
                )}
            </div>

            {msg && 
            <p className="note" role="status">{msg}</p>
            }
            <button className="btn s" onClick={save}>Save rates</button>
            </div>
            );
        }

function Account() {
    const [cur, setCur] = useState('');
    const [nw, setNw] = useState('');
    const [msg, setMsg] = useState('');
    async function go() {
        setMsg(''); try {
            await changePasscode(cur, nw);
            setMsg('Passcode changed.');
            setCur('');
            setNw('');
        }
        catch (e) {
            setMsg(e.message);
        }
    }
    return (
    <div className="pn">
        <h3>Change admin passcode</h3>

        <label>Current passcode</label>
        <input 
        type="password" 
        value={cur}
        autoComplete="current-password"
        onChange={(e) => setCur(e.target.value)} 
        />

        <label>New passcode (8+ characters)</label>
        <input type="password" 
        value={nw} 
        autoComplete="new-password" 
        onChange={(e) => setNw(e.target.value)} 
        />

        {msg && <p className="note" role="status">{msg}</p>}
        <button className="btn s" onClick={go}>Change passcode</button>
        </div>
        );
    }
export default function AdminApp() {
    const [auth, setAuth] = useState('loading');
    const [tab, setTab] = useState('products');
    const [pass, setPass] = useState('');
    const [err, setErr] = useState('');

    useEffect(() => { 
        adminMe().then((ok) => setAuth(ok ? 'in' : 'out')).catch(() => setAuth('out')); }, 
        []);

    async function login(e) {
        e.preventDefault(); setErr(''); try {
            await adminLogin(pass);
            setPass('');
            setAuth('in');
        }
        catch (x) {
            setErr(x.message);
        }
    }
    async function logout() { await adminLogout().catch(() => { }); setAuth('out'); }
    if (auth === 'loading')
        return <div className="w adm"><p className="note">Loading…</p></div>;
    if (auth === 'out')
        return (<div className="w adm"><form className="pn" onSubmit={login} style={{ maxWidth: 420, margin: '0 auto' }}>
            <h3>Admin login</h3>
            <label htmlFor="pc">Admin passcode</label>
            <input 
            id="pc" 
            type="password" 
            autoComplete="current-password" 
            value={pass} onChange={(e) => setPass(e.target.value)} 
            autoFocus />

            {err && 
            <div className="err" role="alert">{err}</div>
            }
            <button 
            className="btn" 
            type="submit">Log in</button>
            </form>
            </div>
            );
            
    return (
    <div className="w adm">
        <h2>Admin dashboard</h2>
        <div className="opt tabs">{TABS.map(([k, l]) => 
            <button 
            key={k} 
            className={`chip${tab === k ? ' on' : ''}`} 
            onClick={() => setTab(k)}>{l}</button>
        )}
            <button 
            className="chip" 
            onClick={logout}>Log out</button>
            </div>

        {tab === 'products' && <Products />}
        {tab === 'orders' && <Orders />}
        {tab === 'customers' && <Customers />}
        {tab === 'rates' && <Rates />}
        {tab === 'account' && <Account />}
    </div>);
}
