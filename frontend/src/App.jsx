import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import { MenuPage, DishPage, AuthPage, CartPage, CheckoutPage, OrdersPage, OrderDetailPage, ReservationPage, ProfilePage, FavoritesPage, NotFound } from './pages/CustomerPages';
import { AdminLayout, AdminDashboard, AdminMenu, AdminOrders, AdminReservations, AdminCustomers } from './pages/AdminPages';
import { useApp } from './context/AppContext';

function Guard({ children, admin = false }) {
  const { user, authLoading } = useApp();
  const location = useLocation();
  if (authLoading) return <div className="screen-loader"><span className="loader-mark">E<span>&</span>P</span><p>Setting the table...</p></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function RouteView({ children }) {
  return <motion.main className="page-enter" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: 0.22 }}>{children}</motion.main>;
}

export default function App() {
  const location = useLocation();
  const adminPath = location.pathname.startsWith('/admin');
  return <div className="app-shell">
    {!adminPath && <Header />}
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RouteView><Home /></RouteView>} />
        <Route path="/menu" element={<RouteView><MenuPage /></RouteView>} />
        <Route path="/menu/:id" element={<RouteView><DishPage /></RouteView>} />
        <Route path="/cart" element={<RouteView><CartPage /></RouteView>} />
        <Route path="/checkout" element={<Guard><RouteView><CheckoutPage /></RouteView></Guard>} />
        <Route path="/login" element={<RouteView><AuthPage mode="login" /></RouteView>} />
        <Route path="/register" element={<RouteView><AuthPage mode="register" /></RouteView>} />
        <Route path="/profile" element={<Guard><RouteView><ProfilePage /></RouteView></Guard>} />
        <Route path="/orders" element={<Guard><RouteView><OrdersPage /></RouteView></Guard>} />
        <Route path="/orders/:id" element={<Guard><RouteView><OrderDetailPage /></RouteView></Guard>} />
        <Route path="/reservations" element={<RouteView><ReservationPage /></RouteView>} />
        <Route path="/favorites" element={<Guard><RouteView><FavoritesPage /></RouteView></Guard>} />
        <Route path="/admin" element={<Guard admin><AdminLayout><AdminDashboard /></AdminLayout></Guard>} />
        <Route path="/admin/menu" element={<Guard admin><AdminLayout><AdminMenu /></AdminLayout></Guard>} />
        <Route path="/admin/orders" element={<Guard admin><AdminLayout><AdminOrders /></AdminLayout></Guard>} />
        <Route path="/admin/reservations" element={<Guard admin><AdminLayout><AdminReservations /></AdminLayout></Guard>} />
        <Route path="/admin/customers" element={<Guard admin><AdminLayout><AdminCustomers /></AdminLayout></Guard>} />
        <Route path="*" element={<RouteView><NotFound /></RouteView>} />
      </Routes>
    </AnimatePresence>
    {!adminPath && <Footer />}
  </div>;
}
