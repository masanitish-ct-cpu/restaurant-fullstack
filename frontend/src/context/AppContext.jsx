import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../services/api';

const AppContext = createContext(null);
const storedCart = () => {
  try { return JSON.parse(localStorage.getItem('ember-cart') || '[]'); } catch { return []; }
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem('ember-token')));
  const [cart, setCart] = useState(storedCart);
  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(window.toastTimer);
    window.toastTimer = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    localStorage.setItem('ember-cart', JSON.stringify(cart));
  }, [cart]);

  const refreshFavorites = useCallback(async () => {
    if (!localStorage.getItem('ember-token')) { setFavorites([]); return; }
    try { setFavorites((await api.get('/favorites')).data.map((item) => item._id)); } catch (error) { notify(errorMessage(error), 'error'); }
  }, [notify]);

  useEffect(() => {
    if (!localStorage.getItem('ember-token')) { setAuthLoading(false); return; }
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('ember-token')).finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => { if (user) refreshFavorites(); else setFavorites([]); }, [user, refreshFavorites]);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('ember-token', data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async (details) => {
    const { data } = await api.post('/auth/register', details);
    localStorage.setItem('ember-token', data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem('ember-token');
    setUser(null);
    setFavorites([]);
    notify('You have been signed out.');
  };
  const addToCart = (dish, quantity = 1) => {
    setCart((items) => {
      const current = items.find((item) => item._id === dish._id);
      return current
        ? items.map((item) => item._id === dish._id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...items, { ...dish, quantity }];
    });
    notify(`${dish.name} added to your bag.`);
  };
  const updateQuantity = (id, quantity) => setCart((items) => quantity < 1 ? items.filter((item) => item._id !== id) : items.map((item) => item._id === id ? { ...item, quantity } : item));
  const toggleFavorite = async (id) => {
    if (!user) { notify('Sign in to save your favorite dishes.', 'error'); return false; }
    const saved = favorites.includes(id);
    try {
      if (saved) await api.delete(`/favorites/${id}`);
      else await api.post(`/favorites/${id}`);
      setFavorites((items) => saved ? items.filter((item) => item !== id) : [...items, id]);
      return true;
    } catch (error) { notify(errorMessage(error), 'error'); return false; }
  };

  const value = useMemo(() => ({ user, setUser, authLoading, login, register, logout, cart, setCart, addToCart, updateQuantity, favorites, toggleFavorite, refreshFavorites, notify }), [user, authLoading, cart, favorites, notify, refreshFavorites]);
  return <AppContext.Provider value={value}>{children}{toast && <div className={`toast toast-${toast.type}`} role="status">{toast.message}</div>}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
