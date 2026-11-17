import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Mark } from './Logo';
import { adminMe } from '../services/api';
const I = ({ d }) => <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d={d}/></svg>;
export default function Header() {
    const { pathname } = useLocation();
    const [admin, setAdmin] = useState(false);
    useEffect(() => { adminMe().then(setAdmin).catch(() => { }); }, [pathname]);
    const on = (p) => (pathname === p ? 'on' : undefined);
    return (<header>
      <div className="pill">
        <Link className="brand" to="/" aria-label="The Gold Story home"><Mark /><b className="wm">The <em>Gold</em> Story</b></Link>
        <nav className="links" aria-label="Main">
          <Link to="/" className={on('/')} title="Home"><I d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/><span>Home</span></Link>
          <Link to="/studio" className={on('/studio')} title="Customize Your Jewellery"><I d="M6 3h12l4 6-10 12L2 9zM2 9h20M12 21L8 9l4-6 4 6z"/><span>Customize Your Jewellery</span></Link>
          <Link to="/#about" title="About Us"><I d="M12 16v-4M12 8h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z"/><span>About Us</span></Link>
          <Link to="/#cats" title="Categories"><I d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/><span>Categories</span></Link>
          {admin && <Link to="/admin" className={on('/admin')} title="Admin dashboard"><I d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z"/><span>Admin</span></Link>}
        </nav>
        <div className="acts"><Link className="btn s dk" to="/studio"><span>Design yours</span></Link></div>
      </div>
    </header>);
}
