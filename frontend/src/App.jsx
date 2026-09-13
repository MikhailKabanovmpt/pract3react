import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AdminPage from './pages/AdminPage';
import './styles/main.css';

function AppInner() {
  const { loading } = useAuth();
  const [page, setPage] = useState('catalog');

  if (loading) return (
    <div className="loading-screen full">
      <div className="spinner large" />
    </div>
  );

  const renderPage = () => {
    switch (page) {
      case 'catalog': return <CatalogPage setPage={setPage} />;
      case 'cart': return <CartPage setPage={setPage} />;
      case 'auth': return <AuthPage setPage={setPage} />;
      case 'appointments': return <AppointmentsPage />;
      case 'admin': return <AdminPage />;
      default: return <CatalogPage setPage={setPage} />;
    }
  };

  return (
    <div className="app">
      <Header page={page} setPage={setPage} />
      <div className="page-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </AuthProvider>
  );
}
