export function LogoDefs() {
    return (<svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="gsg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe08a"/><stop offset=".5" stopColor="#f0b400"/><stop offset="1" stopColor="#b57f00"/></linearGradient>
        <symbol id="gsl" viewBox="0 0 40 40">
          <path d="M30.6 9.4A15 15 0 1 0 34.1 25.1" fill="none" stroke="url(#gsg)" strokeWidth="4.2" strokeLinecap="round"/>
          <path d="M20.5 20.5H34" fill="none" stroke="url(#gsg)" strokeWidth="4.2" strokeLinecap="round"/>
          <path d="M31 1.5l1.7 4.8 4.8 1.7-4.8 1.7L31 14.5l-1.7-4.8-4.8-1.7 4.8-1.7z" fill="currentColor"/>
        </symbol>
      </defs>
    </svg>);
}
export const Mark = ({ size = 36 }) => (<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true"><use href="#gsl"/></svg>);
