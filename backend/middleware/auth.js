import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function protect(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export async function optionalProtect(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Your account could not be found.' });
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  next();
}
