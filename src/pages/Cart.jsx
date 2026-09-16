
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import { createAppointment } from '../api';

export default function Cart() {
  const { cart, removeFromCart, clearCart, subtotal, total, savings, couponCode, couponApplied, couponDiscount } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fmt = (n) => n.toLocaleString('ru-RU') + ' ₽';

  const discountedPrice = (price, pct) =>
    pct > 0 ? Math.round(price * (1 - pct / 100)) : price;

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    setError(null);
    try {
      await createAppointment(
        cart.map(item => ({ service_id: item.id, quantity: item.qty })),
        couponApplied ? couponCode : null,
      );
      clearCart();
      navigate('/order-success');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка оформления заказа');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return (
    <div className="cart-empty">
      <div className="big-emoji">🛒</div>
      <h2>Корзина пуста</h2>
      <p>Добавьте котов из каталога!</p>
      <button className="btn-primary" onClick={() => navigate('/')}>
        Перейти в каталог
      </button>
    </div>
  );

  return (
    <div className="cart-page">
      <h2>Корзина 🛒</h2>

      <div className="cart-items">
        {cart.map((item) => {
          const price = discountedPrice(item.price, item.discount_percent || 0);
          return (
            <div key={item.id} className="cart-item">
              <span className="cart-item-icon">{item.icon || '🐱'}</span>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-meta">
                  {item.category_name} · кол-во: {item.qty}
                  {item.discount_percent > 0 && ` · скидка ${item.discount_percent}%`}
                </div>
              </div>
              <div className="cart-item-price">{fmt(price * item.qty)}</div>
              <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          );
        })}
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="cart-summary">
        <div className="summary-row">
          <span>Подытог</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {couponApplied && (
          <div className="summary-row">
            <span>Купон ({couponDiscount}%)</span>
            <span className="savings">-{fmt(savings)}</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Итого</span>
          <span>{fmt(total)}</span>
        </div>
        {savings > 0 && (
          <p className="savings-hint">💰 Вы экономите: {fmt(savings)}</p>
        )}
        <button
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? '⏳ Оформление...' : `Оформить заказ → ${fmt(total)}`}
        </button>
        {!user && (
          <p className="auth-hint">⚠️ Войдите для оформления заказа</p>
        )}
      </div>
    </div>
  );
}
