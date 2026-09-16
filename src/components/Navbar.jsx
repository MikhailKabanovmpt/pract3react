
import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { CartContext } from '../contexts/CartContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useContext(AuthContext);
  const { totalItems } = useContext(CartContext);
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    'nav-link' + (isActive ? ' active' : '');

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate('/')}>Кото<span>Маркет</span></div>

      <nav className="nav">
        <NavLink to="/" end className={linkClass}>Каталог</NavLink>
        <NavLink to="/cart" className={linkClass}>Корзина</NavLink>
        {/* Ссылка на историю заказов для авторизованных пользователей */}
        {user && <NavLink to="/orders" className={linkClass}>Мои заказы</NavLink>}
        {isAdmin && <NavLink to="/admin" className={linkClass}>Администрирование</NavLink>}
      </nav>

      <div className="header-right">
        <NavLink to="/cart" className="cart-btn">
          🛒 Корзина
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </NavLink>

        {user ? (
          <>
            <div className="user-badge">
              <span className="user-dot" />
              {user.full_name || user.email}
            </div>
            <button className="auth-btn logout" onClick={() => { logout(); navigate('/'); }}>
              Выйти
            </button>
          </>
        ) : (
          <NavLink to="/login" className="auth-btn">Войти</NavLink>
        )}
      </div>
    </header>
  );
}