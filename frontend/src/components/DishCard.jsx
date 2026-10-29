import { motion } from 'framer-motion';
import { ArrowUpRight, Heart, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function DishCard({ dish, index = 0 }) {
  const { addToCart, favorites, toggleFavorite } = useApp();
  const favorite = favorites.includes(dish._id);
  return (
    <motion.article className="dish-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, delay: Math.min(index * 0.07, 0.28) }}>
      <div className="dish-image">
        <Link to={`/menu/${dish._id}`} aria-label={`View ${dish.name}`}><img src={dish.image} alt={dish.name} loading="lazy" /></Link>
        {dish.featured && <span className="dish-ribbon">HOUSE FAVORITE</span>}
        <button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} onClick={() => toggleFavorite(dish._id)}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
        <button className="quick-add" aria-label={`Add ${dish.name} to cart`} onClick={() => addToCart(dish)}><Plus size={19} /></button>
      </div>
      <div className="dish-copy">
        <div className="dish-meta"><span>{dish.category}</span><span className="rating"><Star size={13} fill="currentColor" /> {Number(dish.rating || 4.8).toFixed(1)}</span></div>
        <div className="dish-title-row"><Link to={`/menu/${dish._id}`}><h3>{dish.name}</h3></Link><span className={`diet-dot ${dish.dietary === 'Veg' ? 'veg' : 'nonveg'}`} title={dish.dietary} /></div>
        <p>{dish.description}</p>
        <div className="dish-bottom"><span className="price">${Number(dish.price).toFixed(2)}</span><button className="text-link" onClick={() => addToCart(dish)}>Add to order <ArrowUpRight size={15} /></button></div>
      </div>
    </motion.article>
  );
}
