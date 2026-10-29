import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Clock3, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { errorMessage } from '../services/api';
import DishCard from '../components/DishCard';
import { useApp } from '../context/AppContext';

const heroImage = '/images/restaurant.jpg';

export default function Home() {
  const [dishes, setDishes] = useState([]);
  const [error, setError] = useState('');
  const { notify } = useApp();
  const [email, setEmail] = useState('');
  useEffect(() => {
    api.get('/menu', { params: { featured: true } }).then(({ data }) => setDishes(data.slice(0, 3))).catch((err) => setError(errorMessage(err)));
  }, []);
  return <div className="home-page">
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(14,15,13,.83) 0%, rgba(14,15,13,.54) 48%, rgba(14,15,13,.15) 100%), url("${heroImage}")` }}>
      <div className="hero-grain" />
      <div className="hero-content">
        <motion.span className="eyebrow eyebrow-light" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>A TABLE FOR EVERY OCCASION</motion.span>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2, duration: .7 }}>Where every<br />plate tells <i>a story.</i></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .4 }}>Thoughtfully sourced. Fire-kissed. Made to be shared.<br />A neighborhood table with a little more soul.</motion.p>
        <motion.div className="hero-actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }}>
          <Link className="button button-gold" to="/menu">Explore the menu <ArrowUpRight size={16} /></Link><Link className="button button-outline" to="/reservations">Reserve a table</Link>
        </motion.div>
        <div className="hero-caption"><span className="hero-line" /> FROM OUR KITCHEN, WITH LOVE</div>
      </div>
      <a href="#popular" className="scroll-cue"><ArrowDown size={16} /> SCROLL TO EXPLORE</a>
      <div className="hero-index">40°43' N&nbsp; 73°59' W</div>
    </section>
    <section className="welcome-strip">
      <span>GOOD FOOD, GOOD COMPANY</span><span className="strip-diamond">✳</span><span>SEASONAL INGREDIENTS</span><span className="strip-diamond">✳</span><span>ALWAYS MADE WITH INTENTION</span>
    </section>
    <section id="popular" className="section section-light popular-section">
      <div className="section-heading"><div><span className="eyebrow">A FEW HOUSE FAVORITES</span><h2>Worth coming<br /><i>back for.</i></h2></div><Link className="text-link" to="/menu">Discover the full menu <ArrowUpRight size={16} /></Link></div>
      {error ? <div className="inline-error">{error}</div> : dishes.length ? <div className="dish-grid">{dishes.map((dish, index) => <DishCard key={dish._id} dish={dish} index={index} />)}</div> : <div className="empty-dishes"><span className="skeleton skeleton-card" /><span className="skeleton skeleton-card" /><span className="skeleton skeleton-card" /></div>}
    </section>
    <section className="story-section" id="story">
      <div className="story-image"><img src="/images/kitchen-story.jpg" alt="Chef preparing a dish in the Ember & Plate kitchen" loading="lazy" /><div className="story-stamp"><span>EST.</span><strong>2018</strong><small>NEW YORK</small></div></div>
      <div className="story-copy"><span className="eyebrow">A LITTLE ABOUT US</span><h2>Rooted in ritual.<br />Made for <i>right now.</i></h2><p>We believe a great meal is never just about what's on the plate. It's the warmth of the room, the clink of glasses, the friend who orders another round.</p><p>Our kitchen brings the world's flavors to a fire-led neighborhood table — with ingredients we know by name and a welcome that feels like coming home.</p><Link className="text-link" to="/reservations">A seat is waiting for you <ArrowUpRight size={16} /></Link></div>
    </section>
    <section className="chef-section">
      <div className="chef-copy"><span className="eyebrow eyebrow-light">THE CHEF'S TABLE</span><h2>Curiosity, served<br /><i>one plate at a time.</i></h2><p>Our menu follows the seasons and trusts the flame. Every dish starts with something beautiful, then gets out of its way.</p><Link className="button button-outline" to="/menu">Meet the menu <ArrowRight size={16} /></Link></div>
      <div className="chef-image"><img src="/images/chef-at-work.jpg" alt="Chef at work in the open kitchen" loading="lazy" /><span>THE ART OF THE EVERYDAY</span></div>
    </section>
    <section className="values-section section-light"><div className="values-title"><span className="eyebrow">THE EMBER WAY</span><h2>Small details.<br /><i>Big feeling.</i></h2></div><div className="values-grid"><article><span>01</span><h3>From close by</h3><p>Good food starts with good people. We partner with farmers and makers who care as much as we do.</p></article><article><span>02</span><h3>Led by the flame</h3><p>Fire brings out the honest, beautiful character in an ingredient. We let it do what it does best.</p></article><article><span>03</span><h3>Room for everyone</h3><p>Come as you are, bring who you love. There's always a place at our table for one more.</p></article></div></section>
    <section className="quote-section"><span className="eyebrow eyebrow-light">KIND WORDS, PASSED AROUND</span><div className="quote-stars">★★★★★</div><blockquote>“The sort of place that reminds you why<br />going out to dinner can feel like magic.”</blockquote><div className="quote-author">MAYA R. <span>·</span> NEW YORK, NY</div></section>
    <section className="reservation-band"><div><span className="eyebrow eyebrow-light">YOUR TABLE IS WAITING</span><h2>Make an evening <i>of it.</i></h2><p>Good company. A good bottle. Now all that's missing is you.</p></div><Link className="button button-gold" to="/reservations">Find your table <ArrowUpRight size={16} /></Link></section>
    <section className="visit-section section-light" id="contact"><div><span className="eyebrow">COME FIND US</span><h2>Stay a while.</h2><div className="visit-details"><p><MapPin size={17} />18 Mercer Street, New York, NY</p><p><Clock3 size={17} />Tuesday – Sunday, 5:00 pm – 10:30 pm</p></div><Link className="text-link" to="/reservations">Make a reservation <ArrowUpRight size={16} /></Link></div><div className="visit-image"><img src="/images/candlelit-dining.jpg" alt="Warm candlelit dining room" loading="lazy" /><div className="hours-card"><span>THE KITCHEN'S OPEN</span><strong>TUE — SUN</strong><small>5:00 PM — 10:30 PM</small></div></div></section>
    <section className="newsletter-band"><span className="eyebrow eyebrow-light">A NOTE FROM THE KITCHEN</span><h2>A little something <i>good.</i></h2><p>Seasonal menus, familiar faces, and the occasional excuse to come by.</p><form className="newsletter newsletter-large" onSubmit={(event) => { event.preventDefault(); notify('You’re on our list. Something good is on its way.'); setEmail(''); }}><input type="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} required /><button aria-label="Subscribe"><ArrowRight size={18} /></button></form></section>
  </div>;
}
