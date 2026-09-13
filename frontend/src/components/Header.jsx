import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header({ page, setPage }) {
  const { user, authLogout } = useAuth();
  const { totalCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        <button className="logo" onClick={() => setPage('catalog')}>
          <span className="logo-icon">✦</span>
          <span>BeautyLux</span>
        </button>

        <nav className="nav">
          <button className={`nav-btn ${page === 'catalog' ? 'active' : ''}`} onClick={() => setPage('catalog')}>
            Каталог
          </button>
          {user && (
            <button className={`nav-btn ${page === 'appointments' ? 'active' : ''}`} onClick={() => setPage('appointments')}>
              Мои записи
            </button>
          )}
          {user?.role === 'admin' && (
            <button className={`nav-btn ${page === 'admin' ? 'active' : ''}`} onClick={() => setPage('admin')}>
              Панель
            </button>
          )}
        </nav>

        <div className="header-actions">
          <button className="cart-btn" onClick={() => setPage('cart')}>
            <span className="cart-icon">🛒</span>
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </button>

          {user ? (
            <div className="user-menu">
              <button className="user-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <span className="user-avatar">{user.name[0]}</span>
                <span className="user-name">{user.name}</span>
              </button>
              {menuOpen && (
                <div className="dropdown">
                  <div className="dropdown-info">
                    <div className="di-email">{user.email}</div>
                    <div className="di-role">{user.role === 'admin' ? '👑 Администратор' : '✨ Клиент'}</div>
                    {user.coupon_code && (
                      <div className="di-coupon">🎟 {user.coupon_code} — {user.discount_percent}%</div>
                    )}
                  </div>
                  <button className="dropdown-logout" onClick={() => { authLogout(); setMenuOpen(false); }}>
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setPage('auth')}>Войти</button>
          )}
        </div>
      </div>
    </header>
  );
}
