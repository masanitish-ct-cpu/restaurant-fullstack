import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
}, { timestamps: true });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, maxlength: 600 },
  ingredients: [{ type: String, trim: true }],
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  category: { type: String, required: true, enum: ['Starters', 'Main Course', 'Pizza', 'Pasta', 'Burgers', 'Desserts', 'Beverages'] },
  dietary: { type: String, enum: ['Veg', 'Non-Veg'], default: 'Veg' },
  rating: { type: Number, min: 0, max: 5, default: 4.8 },
  featured: { type: Boolean, default: false },
  available: { type: Boolean, default: true },
}, { timestamps: true });
menuItemSchema.index({ name: 'text', description: 'text', category: 'text' });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  }],
  fulfillment: { type: String, enum: ['Delivery', 'Pickup'], required: true },
  address: { type: String, default: '' },
  phone: { type: String, required: true },
  notes: { type: String, maxlength: 500, default: '' },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  fee: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Pay on collection' },
  status: { type: String, enum: ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Placed' },
}, { timestamps: true });

const reservationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true, min: 1, max: 20 },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  request: { type: String, maxlength: 500, default: '' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
}, { timestamps: true });

const favoriteSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
}, { timestamps: true });
favoriteSchema.index({ customer: 1, menuItem: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
export const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
