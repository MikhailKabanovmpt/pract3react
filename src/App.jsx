
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';

import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { CategoriesProvider } from './contexts/CategoriesContext';

import Navbar from './components/Navbar';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Register from './pages/Register'; 
import Orders from './pages/Orders';

function RequireAuth({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}


function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Orders />} path="/orders" />
        
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route
            path="/order-success"
            element={
              <RequireAuth>
                <div className="order-success">
                  <div style={{ fontSize: '5rem' }}>🎉</div>
                  <h2 style={{ color: 'var(--green)' }}>Заказ оформлен!</h2>
                  <p>Мы скоро свяжемся с вами для подтверждения.</p>
                </div>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </CategoriesProvider>
    </AuthProvider>
  );
}
