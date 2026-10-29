import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { cart, user } = useApp();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/menu?search=${encodeURIComponent(search)}`);
    setSearchOpen(false); setOpen(false);
  };
  const closeMenu = () => setOpen(false);
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <button className="mobile-menu icon-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <Link to="/" className="brand" onClick={closeMenu}><span className="brand-mark">E<span>&</span>P</span><span className="brand-name">EMBER <i>&</i> PLATE<small>DINING, REIMAGINED</small></span></Link>
        <nav className={open ? 'main-nav nav-open' : 'main-nav'}>
          <NavLink to="/" onClick={closeMenu}>Home</NavLink><NavLink to="/menu" onClick={closeMenu}>Menu</NavLink><a href="/#story" onClick={closeMenu}>About</a><NavLink to="/reservations" onClick={closeMenu}>Reservations</NavLink><a href="/#contact" onClick={closeMenu}>Contact</a>
        </nav>
        <div className="nav-actions">
          {searchOpen && <form className="nav-search" onSubmit={submitSearch}><input autoFocus placeholder="Find a dish..." value={search} onChange={(event) => setSearch(event.target.value)} /><button aria-label="Search"><Search size={16} /></button></form>}
          <button className="icon-button search-trigger" aria-label="Search menu" onClick={() => setSearchOpen(!searchOpen)}><Search /></button>
          <Link className="icon-button bag-link" aria-label="Shopping bag" to="/cart"><ShoppingBag /><span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></Link>
          <Link className="icon-button profile-link" aria-label={user ? 'Profile' : 'Sign in'} to={user ? '/profile' : '/login'}><UserRound /></Link>
          <Link className="button button-gold nav-book" to="/reservations">Book a table <span>↗</span></Link>
        </div>
      </div>
    </header>
  );
}
