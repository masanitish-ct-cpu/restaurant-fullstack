import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User, MenuItem, Category, Order, Reservation, Favorite } from '../models/index.js';
import { protect, optionalProtect, adminOnly } from '../middleware/auth.js';

const router = Router();
const signToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const userView = (user) => ({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.post('/auth/register', asyncRoute(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || !password || password.length < 8) {
    return res.status(400).json({ message: 'Enter a name, valid email, and password with at least 8 characters.' });
  }
  const user = await User.create({ name, email, phone, password });
  res.status(201).json({ token: signToken(user), user: userView(user) });
}));
router.post('/auth/login', asyncRoute(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password || ''))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  res.json({ token: signToken(user), user: userView(user) });
}));
router.get('/auth/me', protect, (req, res) => res.json({ user: userView(req.user) }));
router.patch('/auth/me', protect, asyncRoute(async (req, res) => {
  const updates = {};
  for (const field of ['name', 'phone']) if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim();
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ user: userView(user) });
}));

router.get('/menu/categories', asyncRoute(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories.length ? categories : ['Starters', 'Main Course', 'Pizza', 'Pasta', 'Burgers', 'Desserts', 'Beverages']);
}));
router.get('/admin/menu', protect, adminOnly, asyncRoute(async (req, res) => res.json(await MenuItem.find().sort({ category: 1, name: 1 }))));
router.get('/menu', asyncRoute(async (req, res) => {
  const query = { available: true };
  if (req.query.category && req.query.category !== 'All') query.category = req.query.category;
  if (req.query.dietary && req.query.dietary !== 'All') query.dietary = req.query.dietary;
  if (req.query.featured === 'true') query.featured = true;
  if (req.query.search) query.$text = { $search: String(req.query.search) };
  if (req.query.minPrice || req.query.maxPrice) query.price = {
    ...(req.query.minPrice ? { $gte: Number(req.query.minPrice) } : {}),
    ...(req.query.maxPrice ? { $lte: Number(req.query.maxPrice) } : {}),
  };
  const sort = req.query.sort === 'price-low' ? { price: 1 } : req.query.sort === 'price-high' ? { price: -1 } : req.query.sort === 'rating' ? { rating: -1 } : { featured: -1, createdAt: -1 };
  res.json(await MenuItem.find(query).sort(sort));
}));
router.get('/menu/:id', asyncRoute(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Dish not found.' });
  res.json(item);
}));
router.post('/menu', protect, adminOnly, asyncRoute(async (req, res) => res.status(201).json(await MenuItem.create(req.body))));
router.patch('/menu/:id', protect, adminOnly, asyncRoute(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: 'Dish not found.' });
  res.json(item);
}));
router.delete('/menu/:id', protect, adminOnly, asyncRoute(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Dish not found.' });
  await Favorite.deleteMany({ menuItem: item._id });
  res.json({ message: 'Dish deleted.' });
}));

router.get('/favorites', protect, asyncRoute(async (req, res) => {
  const favorites = await Favorite.find({ customer: req.user._id }).populate('menuItem');
  res.json(favorites.map((favorite) => favorite.menuItem).filter(Boolean));
}));
router.post('/favorites/:id', protect, asyncRoute(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Dish not found.' });
  await Favorite.updateOne({ customer: req.user._id, menuItem: item._id }, { $setOnInsert: { customer: req.user._id, menuItem: item._id } }, { upsert: true });
  res.status(201).json({ message: 'Added to favorites.' });
}));
router.delete('/favorites/:id', protect, asyncRoute(async (req, res) => {
  await Favorite.deleteOne({ customer: req.user._id, menuItem: req.params.id });
  res.json({ message: 'Removed from favorites.' });
}));

router.post('/orders', protect, asyncRoute(async (req, res) => {
  const { items, fulfillment, address, phone, notes } = req.body;
  if (!Array.isArray(items) || !items.length || !['Delivery', 'Pickup'].includes(fulfillment)) return res.status(400).json({ message: 'Your order or fulfillment details are missing.' });
  if (fulfillment === 'Delivery' && !address?.trim()) return res.status(400).json({ message: 'Enter a delivery address.' });
  const ids = items.map((item) => item.menuItem);
  const dishes = await MenuItem.find({ _id: { $in: ids }, available: true });
  const dishMap = new Map(dishes.map((dish) => [String(dish._id), dish]));
  const orderItems = items.map((item) => {
    const dish = dishMap.get(String(item.menuItem));
    const quantity = Number(item.quantity);
    if (!dish || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw Object.assign(new Error('One or more order items are invalid or unavailable.'), { status: 400 });
    return { menuItem: dish._id, name: dish.name, image: dish.image, price: dish.price, quantity };
  });
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const fee = fulfillment === 'Delivery' ? 4.5 : 0;
  const order = await Order.create({ customer: req.user._id, items: orderItems, fulfillment, address: address || '', phone: phone || req.user.phone, notes, subtotal, tax, fee, total: subtotal + tax + fee });
  res.status(201).json(await order.populate('customer', 'name email'));
}));
router.get('/orders/mine', protect, asyncRoute(async (req, res) => res.json(await Order.find({ customer: req.user._id }).sort({ createdAt: -1 }))));
router.get('/orders/:id', protect, asyncRoute(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer', 'name email phone');
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (req.user.role !== 'admin' && String(order.customer._id) !== String(req.user._id)) return res.status(403).json({ message: 'You do not have access to this order.' });
  res.json(order);
}));
router.get('/orders', protect, adminOnly, asyncRoute(async (req, res) => res.json(await Order.find().populate('customer', 'name email phone').sort({ createdAt: -1 }))));
router.patch('/orders/:id/status', protect, adminOnly, asyncRoute(async (req, res) => {
  const allowed = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid order status.' });
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('customer', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json(order);
}));

router.post('/reservations', optionalProtect, asyncRoute(async (req, res) => {
  const { date, time, guests, name, phone, email, request } = req.body;
  if (!date || !time || !name?.trim() || !phone?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || !Number.isInteger(Number(guests)) || guests < 1 || guests > 20) {
    return res.status(400).json({ message: 'Please complete all reservation details. Party size must be 1–20.' });
  }
  if (new Date(date) < new Date(new Date().toDateString())) return res.status(400).json({ message: 'Choose a future date for your reservation.' });
  const reservation = await Reservation.create({ date, time, guests, name, phone, email, request, customer: req.user?._id || null });
  res.status(201).json(reservation);
}));
router.get('/reservations/mine', protect, asyncRoute(async (req, res) => res.json(await Reservation.find({ customer: req.user._id }).sort({ date: 1 }))));
router.delete('/reservations/:id', protect, asyncRoute(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, customer: req.user._id });
  if (!reservation) return res.status(404).json({ message: 'Reservation not found.' });
  reservation.status = 'Cancelled';
  await reservation.save();
  res.json(reservation);
}));
router.get('/reservations', protect, adminOnly, asyncRoute(async (req, res) => {
  const filter = req.query.date ? { date: { $gte: new Date(`${req.query.date}T00:00:00`), $lt: new Date(`${req.query.date}T23:59:59.999`) } } : {};
  res.json(await Reservation.find(filter).populate('customer', 'name email').sort({ date: 1 }));
}));
router.patch('/reservations/:id/status', protect, adminOnly, asyncRoute(async (req, res) => {
  if (!['Pending', 'Confirmed', 'Cancelled'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid reservation status.' });
  const reservation = await Reservation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!reservation) return res.status(404).json({ message: 'Reservation not found.' });
  res.json(reservation);
}));

router.get('/admin/stats', protect, adminOnly, asyncRoute(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [revenue, orderCount, reservations, customers, allOrders, popular, recentOrders] = await Promise.all([
    Order.aggregate([{ $match: { createdAt: { $gte: today }, status: { $ne: 'Cancelled' } } }, { $group: { _id: null, value: { $sum: '$total' } } }]),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Reservation.countDocuments({ date: { $gte: today }, status: { $ne: 'Cancelled' } }),
    User.countDocuments({ role: 'customer' }),
    Order.find({ status: { $ne: 'Cancelled' } }).select('total createdAt'),
    Order.aggregate([{ $unwind: '$items' }, { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    Order.find().populate('customer', 'name').sort({ createdAt: -1 }).limit(6),
  ]);
  const average = allOrders.length ? allOrders.reduce((sum, order) => sum + order.total, 0) / allOrders.length : 0;
  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    return { day: date.toLocaleDateString('en', { weekday: 'short' }), revenue: allOrders.filter((order) => order.createdAt >= start && order.createdAt <= end).reduce((sum, order) => sum + order.total, 0) };
  });
  res.json({ revenue: revenue[0]?.value || 0, orderCount, reservations, customers, average: Math.round(average * 100) / 100, popular: popular.map((item) => ({ name: item._id, orders: item.count })), chart, recentOrders });
}));
router.get('/admin/customers', protect, adminOnly, asyncRoute(async (req, res) => res.json(await User.find({ role: 'customer' }).select('name email phone createdAt').sort({ createdAt: -1 }))));

export default router;
