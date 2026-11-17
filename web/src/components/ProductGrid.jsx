import { Link } from 'react-router-dom';
import { media } from '../lib/api';
function Card({ p, i }) {
    const dk = i % 2 === 0, soon = p.status === 'unfulfilled';
    return (<article className={`pc ${dk ? 'dk' : 'lt'}`}>
      <div className={`im ${dk ? 'nv' : 'bg'}${soon ? ' soon' : ''}`}>
        {p.images[0] && <img src={media(p.images[0])} alt={`${p.name} in ${p.purities.join(' and ')} gold`} width={800} height={800} loading={i < 3 ? 'eager' : 'lazy'} decoding="async"/>}
        {p.isNew && <span className="nw">NEW</span>}
        <div className="bn">{soon ? 'Coming soon' : `${p.purities.join(' & ')} · Made to order`}</div>
      </div>
      <div className="pb">
        <div className="pr1">
          <h3>{p.name}</h3>
          <div className="pr">{soon ? <span className="soon">Coming soon</span> : <Link to={`/studio?product=${p.slug}`}>Customize ↗</Link>}</div>
        </div>
        <div className="tgs">{p.purities.map((x) => <span key={x}>{x}</span>)}<span>Name</span><span>Logo</span></div>
      </div>
    </article>);
}
export default function ProductGrid({ products, loading = false }) {
    if (loading)
        return <p className="hint2">Loading pieces…</p>;
    if (!products.length)
        return <p className="hint2">New pieces are coming soon.</p>;
    return <div className="pg6">{products.map((p, i) => <Card key={p.id} p={p} i={i}/>)}</div>;
}
