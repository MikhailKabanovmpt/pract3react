import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createAppointment, createPayment } from '../api';

export default function CartPage({ setPage }) {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const [datetime, setDatetime] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const userDiscount = user?.discount_percent || 0;
  const total = totalPrice(userDiscount);

  if (success) return (
    <div className="success-screen">
      <div className="success-icon">✓</div>
      <h2>Запись оформлена!</h2>
      <p>Ваши услуги успешно записаны. Ждём вас!</p>
      <button className="btn-primary" onClick={() => { setSuccess(false); setPage('appointments'); }}>
        Мои записи
      </button>
    </div>
  );

  if (items.length === 0) return (
    <div className="empty-cart">
      <div className="empty-icon">🛒</div>
      <h2>Корзина пуста</h2>
      <p>Добавьте услуги из каталога</p>
      <button className="btn-primary" onClick={() => setPage('catalog')}>Перейти в каталог</button>
    </div>
  );

  const handleCheckout = async () => {
    if (!user) { setPage('auth'); return; }
    if (!datetime) { setError('Выберите дату и время'); return; }
    setLoading(true);
    setError('');
    try {
      for (const item of items) {
        const appt = await createAppointment({
          service_id: item.id,
          appointment_time: datetime,
        });
        const disc = Math.max(item.discount_percent || 0, userDiscount);
        const price = item.price * (1 - disc / 100) * item.qty;
        await createPayment({ appointment_id: appt.id, amount: Math.round(price), method });
      }
      clearCart();
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-page">
      <h1 className="page-title">Корзина</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const disc = Math.max(item.discount_percent || 0, userDiscount);
            const discPrice = item.price * (1 - disc / 100);
            return (
              <div key={item.id} className="cart-item">
                <div className="ci-info">
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-meta">
                    <span>⏱ {item.duration_min} мин</span>
                    {disc > 0 && <span className="ci-discount">−{disc}%</span>}
                  </div>
                </div>
                <div className="ci-controls">
                  <div className="qty-control">
                    <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <div className="ci-price">
                    {disc > 0 && <span className="ci-original">{(item.price * item.qty).toLocaleString('ru-RU')} ₽</span>}
                    <span>{Math.round(discPrice * item.qty).toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <button className="ci-remove" onClick={() => removeItem(item.id)}>✕</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <h2>Оформление</h2>

          {userDiscount > 0 && (
            <div className="coupon-applied">
              🎟 Купон активен: −{userDiscount}%
              {user.coupon_code && <span> ({user.coupon_code})</span>}
            </div>
          )}

          <div className="summary-total">
            <span>Итого:</span>
            <span className="total-price">{Math.round(total).toLocaleString('ru-RU')} ₽</span>
          </div>

          <label className="field">
            <span>Дата и время</span>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </label>

          <label className="field">
            <span>Способ оплаты</span>
            <div className="payment-methods">
              <label className={`pm-option ${method === 'card' ? 'selected' : ''}`}>
                <input type="radio" name="method" value="card" checked={method === 'card'} onChange={() => setMethod('card')} />
                💳 Карта
              </label>
              <label className={`pm-option ${method === 'cash' ? 'selected' : ''}`}>
                <input type="radio" name="method" value="cash" checked={method === 'cash'} onChange={() => setMethod('cash')} />
                💵 Наличные
              </label>
            </div>
          </label>

          {error && <div className="server-error">{error}</div>}

          <button className="btn-primary btn-full" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Обработка...' : user ? 'Записаться' : 'Войти для записи'}
          </button>
        </div>
      </div>
    </div>
  );
}
