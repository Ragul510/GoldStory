import { useState } from 'react';
import data from '../data/howItWorks.json';
/** Expanding cards: hover (mouse) or tap/focus to open a step. The text is in the server-rendered HTML for SEO. */
export default function HowItWorks() {
    const [on, setOn] = useState(0);
    return (
        <div className="w sec" id="how">
            <h2>How it works</h2>
            <p className="hint">Hover over a card to see the step. On a phone, tap it.</p>
            <div className="hx">
                {data.map((d, i) => (<article key={d.n} className={`hk${on === i ? ' on' : ''}`} tabIndex={0} onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse')
                        setOn(i);
                }}
                    onFocus={() =>
                        setOn(i)}
                    onClick={() =>
                        setOn(i)}
                >

            <span className="n">{d.n}</span>
            <h3>{d.title}</h3>
                    <div className="hb">
                        <p dangerouslySetInnerHTML={{ __html: d.desc }} />
                        <div className="ig" dangerouslySetInnerHTML={{ __html: d.html }} />
                    </div>
                </article>
                ))}
            </div>
        </div>
    );
}
