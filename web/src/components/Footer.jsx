import { Link } from 'react-router-dom';
import { Mark } from './Logo';
export default function Footer() {
    return (
        <footer>
      <div className="ft">
        <div className="frow">
                    <div className="fb">
                        <Mark size={46} />
                        <span className="wm">The <em>Gold</em> Story</span>
                        <p>Wear your name. Own your story.</p>
                    </div>
          <nav className="fl2" aria-label="Footer">
            <Link to="/">Home</Link><Link to="/studio">Customize Your Jewellery</Link>
            <Link to="/#about">About Us</Link><Link to="/#cats">Categories</Link>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">WhatsApp support</a>
            <Link to="/#shipping">Shipping</Link>
          </nav>
        </div>

                <div className="fbar">
                    <div className="st">
                        <b>22K · 24K</b>
                        <small>GOLD PURITY</small>
                    </div>
                    <p className="lg">Made to order. Previews are illustrative; final design, weight and price are confirmed before production. © The Gold Story</p>
                    <div className="st">
                        <b>&rsquo;26</b>
                        <small>MADE TO ORDER</small>
                    </div>
                </div>
      </div>
        </footer>
    );
}
