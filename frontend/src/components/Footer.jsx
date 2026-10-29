import { ArrowUpRight, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><Link to="/" className="brand"><span className="brand-mark">E<span>&</span>P</span><span className="brand-name">EMBER <i>&</i> PLATE<small>DINING, REIMAGINED</small></span></Link><p>A little fire. A lot of feeling.<br />Come hungry. Leave with a story.</p></div>
      <div><h4>EXPLORE</h4><Link to="/menu">Our menu</Link><Link to="/reservations">Reservations</Link><a href="/#story">Our story</a><Link to="/orders">Your orders</Link></div>
      <div><h4>FIND US</h4><p>18 Mercer Street<br />New York, NY 10013</p><p>Tue–Sun · 5:00 pm – 10:30 pm</p><a href="tel:+12125550148">+1 (212) 555-0148</a></div>
      <div><h4>STAY IN THE KNOW</h4><p>Notes from our kitchen, delivered occasionally.</p><form className="newsletter" onSubmit={(event) => { event.preventDefault(); window.alert('You’re on the list. See you soon!'); }}><input type="email" placeholder="Your email address" required /><button aria-label="Subscribe"><ArrowUpRight size={18} /></button></form><a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a></div>
    </div>
    <div className="footer-bottom"><span>© 2025 EMBER & PLATE. MADE WITH INTENTION.</span><span>GOOD FOOD. GOOD COMPANY. ALWAYS.</span></div>
  </footer>;
}
