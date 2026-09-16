import { useState, useEffect } from 'react';
import { getMyAppointments } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAppointments()
      .then(res => setOrders(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Загрузка заказов...</div>;

  return (
    <div className="orders-page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📦 История заказов</h2>
      {orders.length === 0 ? (
        <p>У вас пока нет заказов.</p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card" style={{ background: '#1e1e1e', padding: '15px', marginBottom: '15px', borderRadius: '8px', color: '#fff' }}>
              <p><strong>Заказ №{order.id}</strong></p>
              <p>Статус: <span className={`status ${order.status}`}>{order.status}</span></p>
              <p>Итоговая сумма: {order.total_amount} ₽</p>
              <p>Дата: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}