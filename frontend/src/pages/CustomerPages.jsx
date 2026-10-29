import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, LoaderCircle, Minus, Plus, ShoppingBag, Star, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api, { errorMessage } from '../services/api';
import { useApp } from '../context/AppContext';
import DishCard from '../components/DishCard';

const categories = ['All', 'Starters', 'Main Course', 'Pizza', 'Pasta', 'Burgers', 'Desserts', 'Beverages'];
const money = (value) => `$${Number(value || 0).toFixed(2)}`;
function PageIntro({ label, title, copy }) { return <div className="page-intro"><span className="eyebrow">{label}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>; }
function Loading({ label = 'Setting the table...' }) { return <div className="loading-state"><LoaderCircle className="spin" size={22} />{label}</div>; }
function EmptyState({ title, copy, link, action }) { return <div className="empty-state"><span className="empty-icon"><ShoppingBag /></span><h3>{title}</h3><p>{copy}</p>{link && <Link className="button button-dark" to={link}>{action || 'Explore the menu'} <ArrowRight size={16} /></Link>}</div>; }

export function MenuPage() {
  const [params, setParams] = useSearchParams();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const category = params.get('category') || 'All';
  const search = params.get('search') || '';
  const dietary = params.get('dietary') || 'All';
  const sort = params.get('sort') || 'featured';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get('/menu', { params: { category, search, dietary, sort: sort === 'featured' ? undefined : sort, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined } })
      .then(({ data }) => { if (active) setDishes(data); })
      .catch((err) => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category, search, dietary, sort, minPrice, maxPrice]);
  const setFilter = (key, value) => setParams((current) => { if (value && value !== 'All' && value !== 'featured') current.set(key, value); else current.delete(key); return current; });
  return <div className="menu-page section-light">
    <div className="menu-banner"><div><span className="eyebrow eyebrow-light">THE KITCHEN, AT YOUR TABLE</span><h1>Made with care.<br /><i>Ordered with love.</i></h1><p>Season-led plates and kitchen favorites, wherever the evening takes you.</p></div><img src="/images/seasonal-menu.jpg" alt="Beautifully plated seasonal food" /></div>
    <div className="menu-content">
      <div className="menu-toolbar"><div className="category-tabs" role="tablist">{categories.map((name) => <button key={name} className={category === name ? 'category-tab active' : 'category-tab'} onClick={() => setFilter('category', name)}>{name}</button>)}</div></div>
      <div className="filter-row">
        <label className="search-field"><span>⌕</span><input aria-label="Search dishes" value={search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Search our menu..." /></label>
        <select aria-label="Dietary filter" value={dietary} onChange={(event) => setFilter('dietary', event.target.value)}><option value="All">All dietary</option><option>Veg</option><option>Non-Veg</option></select>
        <label className="price-filter"><span>$</span><input aria-label="Minimum price" type="number" min="0" placeholder="Min" value={minPrice} onChange={(event) => setFilter('minPrice', event.target.value)} /><span>—</span><input aria-label="Maximum price" type="number" min="0" placeholder="Max" value={maxPrice} onChange={(event) => setFilter('maxPrice', event.target.value)} /></label>
        <select aria-label="Sort dishes" value={sort} onChange={(event) => setFilter('sort', event.target.value)}><option value="featured">Recommended</option><option value="rating">Top rated</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
      </div>
      <div className="menu-result-count">{loading ? 'Finding your favorites…' : `${dishes.length} ${dishes.length === 1 ? 'dish' : 'dishes'} to fall for`}</div>
      {loading ? <div className="dish-grid">{[1, 2, 3, 4].map((n) => <div className="skeleton skeleton-card" key={n} />)}</div> : error ? <div className="error-state">{error}<button className="text-link" onClick={() => setFilter('category', category)}>Try again</button></div> : dishes.length ? <div className="dish-grid">{dishes.map((dish, index) => <DishCard key={dish._id} dish={dish} index={index} />)}</div> : <EmptyState title="Nothing on the menu just yet." copy="Try a different search or category — there’s always something good." />}
    </div>
  </div>;
}

export function DishPage() {
  const { id } = useParams();
  const { addToCart, favorites, toggleFavorite, notify } = useApp();
  const [dish, setDish] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  useEffect(() => {
    setDish(null);
    api.get(`/menu/${id}`).then(({ data }) => { setDish(data); return api.get('/menu', { params: { category: data.category } }); })
      .then(({ data }) => setRecommended(data.filter((item) => item._id !== id).slice(0, 3)))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);
  if (error) return <div className="content-container"><div className="error-state">{error}<Link className="text-link" to="/menu">Back to the menu</Link></div></div>;
  if (!dish) return <Loading />;
  const isFavorite = favorites.includes(dish._id);
  return <div className="dish-detail-page section-light"><div className="detail-breadcrumb"><Link to="/menu"><ArrowLeft size={15} /> Back to the menu</Link><span>{dish.category}</span></div><div className="detail-main"><div className="detail-image"><img src={dish.image} alt={dish.name} /><span className={`diet-badge ${dish.dietary === 'Veg' ? 'veg' : 'nonveg'}`}>{dish.dietary === 'Veg' ? '●  VEGETARIAN' : '●  NON-VEGETARIAN'}</span></div><div className="detail-copy"><span className="eyebrow">{dish.category.toUpperCase()} · MADE TO ORDER</span><h1>{dish.name}</h1><div className="detail-rating"><span><Star fill="currentColor" size={16} /> {Number(dish.rating || 4.8).toFixed(1)}</span><span>Thoughtfully made, always.</span></div><p className="detail-description">{dish.description}</p><div className="ingredients"><span>FROM THE KITCHEN</span><p>{(dish.ingredients || ['Seasonal ingredients', 'House-made seasoning']).join(' · ')}</p></div><div className="detail-price">{money(dish.price)} <small>PER PLATE</small></div><div className="detail-actions"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button></div><button className="button button-dark" onClick={() => { addToCart(dish, quantity); notify('Added to your bag.'); }}>Add to your order · {money(dish.price * quantity)} <ArrowUpRight size={16} /></button><button className={`detail-favorite ${isFavorite ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(dish._id)} aria-label="Toggle favorite"><Heart fill={isFavorite ? 'currentColor' : 'none'} /></button></div><p className="detail-note">Prepared fresh when you order. Please let us know about any allergies at checkout.</p></div></div>{recommended.length > 0 && <section className="recommendations"><div className="section-heading"><div><span className="eyebrow">GOOD COMPANY FOR YOUR PLATE</span><h2>You might also <i>love.</i></h2></div><Link className="text-link" to="/menu">See everything <ArrowUpRight size={15} /></Link></div><div className="dish-grid">{recommended.map((item, index) => <DishCard key={item._id} dish={item} index={index} />)}</div></section>}</div>;
}

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register, notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (isRegister && form.password !== form.confirm) return setError('Those passwords don’t match.');
    if (form.password.length < 8) return setError('Your password needs at least 8 characters.');
    setLoading(true);
    try {
      await (isRegister ? register({ name: form.name, email: form.email, phone: form.phone, password: form.password }) : login({ email: form.email, password: form.password }));
      notify(isRegister ? 'Welcome to the table.' : 'Welcome back.');
      navigate(location.state?.from?.pathname || '/profile', { replace: true });
    } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); }
  };
  return <div className="auth-page"><div className="auth-visual"><img src="/images/reservation-room.jpg" alt="A candlelit dinner table" /><div className="auth-visual-copy"><span className="eyebrow eyebrow-light">A PLACE AT OUR TABLE</span><p>“Good food is all the sweeter when shared with good friends.”</p><span>— THE EMBER PHILOSOPHY</span></div></div><div className="auth-form-wrap"><div className="auth-form"><span className="eyebrow">{isRegister ? 'COME ON IN' : 'WELCOME BACK'}</span><h1>{isRegister ? 'Your seat is waiting.' : 'Good to see you.'}</h1><p>{isRegister ? 'Create an account to keep your favorites close.' : 'Sign in and pick up where you left off.'}</p>{error && <div className="form-error">{error}</div>}<form onSubmit={submit}>{isRegister && <label>Your name<input value={form.name} onChange={update('name')} autoComplete="name" required maxLength={80} /></label>}<label>Email address<input type="email" value={form.email} onChange={update('email')} autoComplete="email" required /></label>{isRegister && <label>Phone number<input type="tel" value={form.phone} onChange={update('phone')} autoComplete="tel" /></label>}<label>Password<input type="password" value={form.password} onChange={update('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required /></label>{isRegister && <label>Confirm password<input type="password" value={form.confirm} onChange={update('confirm')} autoComplete="new-password" minLength={8} required /></label>}<button disabled={loading} className="button button-dark auth-submit">{loading ? 'One moment…' : isRegister ? 'Create your account' : 'Sign in'} <ArrowRight size={16} /></button></form><div className="auth-switch">{isRegister ? 'Already have a seat?' : 'New to Ember & Plate?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></div></div></div></div>;
}

export function CartPage() {
  const { cart, updateQuantity, setCart } = useApp();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * .08;
  const fee = cart.length ? 4.5 : 0;
  return <div className="section-light cart-page"><PageIntro label="YOUR EVENING, IN PROGRESS" title="Your bag." copy="A few good things, all in one place." />{!cart.length ? <EmptyState title="Your bag is taking a breather." copy="There’s plenty on the menu worth coming back for." link="/menu" /> : <div className="cart-layout"><div className="cart-items"><div className="cart-table-label"><span>YOUR SELECTION</span><button className="text-link muted-link" onClick={() => setCart([])}>Clear bag</button></div>{cart.map((item) => <article className="cart-item" key={item._id}><Link to={`/menu/${item._id}`} className="cart-item-image"><img src={item.image} alt="" /></Link><div className="cart-item-copy"><Link to={`/menu/${item._id}`}><h3>{item.name}</h3></Link><span>{item.category}</span><strong>{money(item.price)}</strong></div><div className="quantity-control"><button aria-label="Remove one" onClick={() => updateQuantity(item._id, item.quantity - 1)}>{item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}</button><span>{item.quantity}</span><button aria-label="Add one" onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={14} /></button></div><strong className="cart-line-total">{money(item.price * item.quantity)}</strong></article>)}<Link className="text-link continue-shopping" to="/menu"><ArrowLeft size={15} /> Keep exploring</Link></div><aside className="order-summary"><span className="eyebrow">A QUICK RECAP</span><h2>Order summary</h2><div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>Tax</span><span>{money(tax)}</span></div><div className="summary-row"><span>Service & delivery</span><span>{money(fee)}</span></div><div className="summary-total"><span>Estimated total</span><strong>{money(subtotal + tax + fee)}</strong></div><p>Delivery fees may vary based on your selection.</p><Link className="button button-dark summary-button" to="/checkout">Continue to checkout <ArrowRight size={16} /></Link><div className="mock-payment-note"><Check size={14} /> Secure checkout · Mock payment</div></aside></div>}</div>;
}

export function CheckoutPage() {
  const { cart, setCart, user, notify } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fulfillment: 'Delivery', address: '', phone: user?.phone || '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * .08; const fee = form.fulfillment === 'Delivery' ? 4.5 : 0;
  if (!cart.length) return <div className="content-container"><EmptyState title="Nothing to check out yet." copy="Add a few kitchen favorites to your bag first." link="/menu" /></div>;
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const placeOrder = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/orders', { ...form, items: cart.map((item) => ({ menuItem: item._id, quantity: item.quantity })) });
      setCart([]); notify('Your order is in. The kitchen is on it.'); navigate(`/orders/${data._id}`);
    } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); }
  };
  return <div className="section-light checkout-page"><PageIntro label="ALMOST THERE" title="Make it yours." copy="A few details, then we’ll get the kitchen going." /><form className="checkout-layout" onSubmit={placeOrder}><div className="checkout-fields"><section className="checkout-card"><span className="step-number">01</span><div><h2>How would you like it?</h2><p>Choose how your evening gets delivered.</p></div><div className="fulfillment-options"><label className={form.fulfillment === 'Delivery' ? 'fulfillment-option selected' : 'fulfillment-option'}><input type="radio" name="fulfillment" value="Delivery" checked={form.fulfillment === 'Delivery'} onChange={update('fulfillment')} /><span>DELIVERY</span><small>To your door · $4.50</small></label><label className={form.fulfillment === 'Pickup' ? 'fulfillment-option selected' : 'fulfillment-option'}><input type="radio" name="fulfillment" value="Pickup" checked={form.fulfillment === 'Pickup'} onChange={update('fulfillment')} /><span>PICKUP</span><small>Ready when you are · Free</small></label></div></section><section className="checkout-card"><span className="step-number">02</span><div><h2>Your details</h2><p>So we know where to find you.</p></div>{form.fulfillment === 'Delivery' && <label>Delivery address<input value={form.address} onChange={update('address')} placeholder="Street address, apartment, city" required /></label>}<label>Phone number<input type="tel" value={form.phone} onChange={update('phone')} required /></label><label>Notes for the kitchen <span className="optional">(optional)</span><textarea value={form.notes} onChange={update('notes')} maxLength={500} placeholder="Allergies, special requests, a note for the kitchen…" rows="3" /></label></section><section className="checkout-card payment-card"><span className="step-number">03</span><div><h2>Payment</h2><p>Mock payment · No card will be charged.</p></div><div className="payment-mock"><Check size={17} /> Pay {form.fulfillment === 'Pickup' ? 'on pickup' : 'at your door'} <small>— payment securely handled on arrival</small></div></section></div><aside className="order-summary checkout-summary"><span className="eyebrow">YOUR ORDER</span>{cart.map((item) => <div className="checkout-line" key={item._id}><span>{item.quantity} × {item.name}</span><span>{money(item.price * item.quantity)}</span></div>)}<div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>Tax</span><span>{money(tax)}</span></div><div className="summary-row"><span>{form.fulfillment === 'Delivery' ? 'Delivery' : 'Pickup'}</span><span>{fee ? money(fee) : 'Free'}</span></div><div className="summary-total"><span>Total</span><strong>{money(subtotal + tax + fee)}</strong></div>{error && <div className="form-error">{error}</div>}<button disabled={loading} className="button button-dark summary-button">{loading ? 'Sending to the kitchen…' : 'Place your order'} <ArrowRight size={16} /></button><div className="mock-payment-note"><Check size={14} /> Review your order before placing</div></aside></form></div>;
}

const orderSteps = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
function OrderTimeline({ status }) { const current = orderSteps.indexOf(status); return <div className="order-timeline">{orderSteps.map((step, index) => <div className={`timeline-step ${index <= current ? 'complete' : ''} ${index === current ? 'current' : ''}`} key={step}><span className="timeline-dot">{index < current ? <Check size={12} /> : index + 1}</span><span>{step}</span></div>)}</div>; }
function OrderCard({ order }) { return <Link className="order-card" to={`/orders/${order._id}`}><div className="order-card-top"><div><span className="eyebrow">ORDER #{order._id.slice(-6).toUpperCase()}</span><strong>{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</strong></div><span className={`status-pill status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></div><div className="order-card-bottom"><span>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(' · ')}</span><strong>{money(order.total)}</strong></div></Link>; }

export function OrdersPage() {
  const [orders, setOrders] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/orders/mine').then(({ data }) => setOrders(data)).catch((err) => setError(errorMessage(err))); }, []);
  return <div className="section-light orders-page"><PageIntro label="YOUR TABLE, YOUR HISTORY" title="The good times." copy="Everything you’ve enjoyed with us, all in one place." />{orders === null ? <Loading /> : error ? <div className="error-state">{error}</div> : orders.length ? <div className="orders-list">{orders.map((order) => <OrderCard key={order._id} order={order} />)}</div> : <EmptyState title="A clean slate." copy="Your first great meal with us is just around the corner." link="/menu" />}</div>;
}

export function OrderDetailPage() {
  const { id } = useParams(); const [order, setOrder] = useState(null); const [error, setError] = useState('');
  useEffect(() => { const load = () => api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).catch((err) => setError(errorMessage(err))); load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, [id]);
  if (error) return <div className="content-container"><div className="error-state">{error}<Link className="text-link" to="/orders">Back to your orders</Link></div></div>;
  if (!order) return <Loading label="Checking in with the kitchen..." />;
  return <div className="section-light order-detail-page"><Link to="/orders" className="text-link"><ArrowLeft size={15} /> All orders</Link><div className="order-detail-heading"><span className="eyebrow">ORDER #{order._id.slice(-6).toUpperCase()}</span><h1>{order.status === 'Delivered' ? 'Enjoy every bite.' : 'We’re on it.'}</h1><p>Placed {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p></div>{order.status !== 'Cancelled' ? <section className="tracking-card"><span className="eyebrow">FRESH FROM THE KITCHEN</span><h2>{order.status === 'Delivered' ? 'Delivered with care.' : `Your order is ${order.status.toLowerCase()}.`}</h2><OrderTimeline status={order.status} /></section> : <div className="form-error">This order has been cancelled.</div>}<div className="order-detail-grid"><section className="order-items-card"><h2>Your order</h2>{order.items.map((item, index) => <div className="order-detail-item" key={`${item.name}-${index}`}><img src={item.image} alt="" /><span>{item.quantity} × {item.name}</span><strong>{money(item.price * item.quantity)}</strong></div>)}<div className="summary-row"><span>Subtotal</span><span>{money(order.subtotal)}</span></div><div className="summary-row"><span>Tax & fees</span><span>{money(order.tax + order.fee)}</span></div><div className="summary-total"><span>Total</span><strong>{money(order.total)}</strong></div></section><section className="order-items-card"><h2>Delivery details</h2><p><strong>{order.fulfillment}</strong></p><p>{order.address || 'Pick up at 18 Mercer Street, New York'}</p><p>{order.phone}</p>{order.notes && <p className="detail-note">Note: {order.notes}</p>}</section></div></div>;
}

export function ReservationPage() {
  const { user, notify } = useApp();
  const [form, setForm] = useState({ date: '', time: '', guests: '2', name: user?.name || '', phone: user?.phone || '', email: user?.email || '', request: '' });
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const minDate = new Date().toLocaleDateString('en-CA');
  useEffect(() => { if (user) api.get('/reservations/mine').then(({ data }) => setReservations(data)).catch((err) => setError(errorMessage(err))); }, [user]);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = await api.post('/reservations', { ...form, guests: Number(form.guests) });
      setReservations((items) => [...items, data]);
      notify('Lovely. Your reservation request is on its way.');
      setForm({ ...form, date: '', time: '', request: '' });
    } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); }
  };
  const cancel = async (id) => {
    try { const { data } = await api.delete(`/reservations/${id}`); setReservations((items) => items.map((item) => item._id === id ? data : item)); notify('Reservation cancelled.'); }
    catch (err) { setError(errorMessage(err)); }
  };
  return <div className="section-light reservation-page"><div className="reservation-hero"><span className="eyebrow eyebrow-light">PULL UP A CHAIR</span><h1>There’s always<br />room for <i>one more.</i></h1><p>Tell us when. We’ll take care of the rest.</p></div><div className="reservation-layout"><div className="reservation-info"><span className="eyebrow">A FEW THINGS TO KNOW</span><h2>Come as you are.</h2><p>We hold tables for 15 minutes past your reservation time. For parties larger than 8, give us a call and we’ll make something special happen.</p><div className="reservation-contact"><strong>THINKING OF SOMETHING SPECIAL?</strong><a href="tel:+12125550148">+1 (212) 555-0148 <ArrowUpRight size={14} /></a></div><div className="hours-note"><span>DINNER, TUESDAY THROUGH SUNDAY</span><strong>5:00 pm — 10:30 pm</strong></div></div><form className="reservation-form" onSubmit={submit}><span className="eyebrow">MAKE A RESERVATION</span><h2>Your table, your time.</h2>{error && <div className="form-error">{error}</div>}<div className="form-row"><label>Date<input type="date" min={minDate} value={form.date} onChange={update('date')} required /></label><label>Time<select value={form.time} onChange={update('time')} required><option value="">Choose a time</option>{['5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM'].map((time) => <option key={time}>{time}</option>)}</select></label></div><div className="form-row"><label>Guests<select value={form.guests} onChange={update('guests')}>{Array.from({ length: 12 }, (_, i) => <option value={i + 1} key={i}>{i + 1} {i ? 'guests' : 'guest'}</option>)}</select></label><label>Your name<input value={form.name} onChange={update('name')} required /></label></div><div className="form-row"><label>Phone<input type="tel" value={form.phone} onChange={update('phone')} required /></label><label>Email<input type="email" value={form.email} onChange={update('email')} required /></label></div><label>Anything we should know? <span className="optional">(optional)</span><textarea value={form.request} onChange={update('request')} rows="3" maxLength={500} placeholder="A birthday, dietary needs, your favorite table…" /></label><button disabled={loading} className="button button-dark">{loading ? 'Sending your request…' : 'Request a table'} <ArrowRight size={16} /></button><p className="form-footnote">We’ll be in touch to confirm your reservation.</p></form></div>{user && reservations.length > 0 && <section className="my-reservations"><span className="eyebrow">YOUR PLANS</span><h2>Reservations</h2>{reservations.map((item) => <div className="reservation-row" key={item._id}><div><strong>{new Date(`${item.date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'long' })} · {item.time}</strong><span>{item.guests} guests · {item.status}</span></div>{item.status !== 'Cancelled' && <button className="text-link muted-link" onClick={() => cancel(item._id)}>Cancel</button>}</div>)}</section>}</div>;
}

export function FavoritesPage() {
  const { user, favorites } = useApp(); const [dishes, setDishes] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/favorites').then(({ data }) => setDishes(data)).catch((err) => setError(errorMessage(err))); }, [favorites, user]);
  return <div className="section-light favorites-page"><PageIntro label="THE ONES YOU LOVE" title="Your favorites." copy="A little collection of things worth ordering again." />{error ? <div className="error-state">{error}</div> : dishes === null ? <Loading /> : dishes.length ? <div className="dish-grid">{dishes.map((dish, index) => <DishCard key={dish._id} dish={dish} index={index} />)}</div> : <EmptyState title="Save a little room for love." copy="Tap the heart on anything that catches your eye." link="/menu" />}</div>;
}

export function ProfilePage() {
  const { user, setUser, logout, notify } = useApp();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); try { const { data } = await api.patch('/auth/me', form); setUser(data.user); notify('Your details have been updated.'); } catch (err) { setError(errorMessage(err)); } };
  return <div className="section-light profile-page"><PageIntro label="YOUR EMBER & PLATE" title="A seat of your own." copy="Your details, your favorites, and all the good times so far." /><div className="profile-layout"><aside className="profile-menu"><Link className="active" to="/profile">Personal details <ArrowRight size={15} /></Link><Link to="/orders">Order history <ArrowRight size={15} /></Link><Link to="/reservations">Reservations <ArrowRight size={15} /></Link><Link to="/favorites">Favorites <ArrowRight size={15} /></Link>{user.role === 'admin' && <Link to="/admin">Admin dashboard <ArrowRight size={15} /></Link>}<button onClick={logout}>Sign out <ArrowRight size={15} /></button></aside><form className="profile-form" onSubmit={submit}><span className="eyebrow">YOUR DETAILS</span><h2>Let’s keep in touch.</h2>{error && <div className="form-error">{error}</div>}<label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Email address<input value={user.email} disabled /></label><label>Phone number<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><button className="button button-dark">Save changes <Check size={16} /></button></form></div></div>;
}

export function NotFound() { return <div className="not-found"><span className="eyebrow">A WRONG TURN, PERHAPS?</span><h1>This page isn’t<br /><i>on the menu.</i></h1><Link className="button button-dark" to="/">Take me home <ArrowRight size={16} /></Link></div>; }
