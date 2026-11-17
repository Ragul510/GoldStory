import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
/** Gold coin badge: the ring of text turns as you scroll (skipped if the visitor prefers reduced motion). */
export default function CoinBadge() {
    const ring = useRef(null);
    useEffect(() => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        let raf = 0;
        const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (ring.current)
            ring.current.style.transform = `rotate(${scrollY * 0.4}deg)`; }); };
        addEventListener('scroll', on, { passive: true });
        return () => removeEventListener('scroll', on);
    }, []);
    return (<Link className="coin" to="/studio" aria-label="Design your own gold jewellery" title="Design your gold">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient id="cb1" cx="35%" cy="30%" r="85%"><stop offset="0" stopColor="#fff1b8"/><stop offset=".4" stopColor="#f6c744"/><stop offset=".8" stopColor="#d9a021"/><stop offset="1" stopColor="#a87408"/></radialGradient>
          <radialGradient id="cb2" cx="60%" cy="68%" r="80%"><stop offset="0" stopColor="#ffe48a"/><stop offset="1" stopColor="#d9a021"/></radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#cb1)"/>
        <circle cx="50" cy="50" r="46.5" fill="none" stroke="#8a5d00" strokeWidth="1.6" strokeDasharray="1.2 2" opacity=".7"/>
        <circle cx="50" cy="50" r="27" fill="url(#cb2)" stroke="#9a6a06" strokeWidth="1"/>
        <svg x="29" y="29" width="42" height="42" viewBox="0 0 40 40" style={{ color: '#5a3c00' }}><use href="#gsl"/></svg>
      </svg>
      <svg className="rg" ref={ring} viewBox="0 0 100 100" aria-hidden="true">
        <defs><path id="cp" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0"/></defs>
        <text fontFamily="Montserrat,sans-serif" fontWeight="700" fontSize="7" letterSpacing="1.8" fill="#5a3c00"><textPath href="#cp">THE GOLD STORY • THE GOLD STORY • </textPath></text>
      </svg>
    </Link>);
}
