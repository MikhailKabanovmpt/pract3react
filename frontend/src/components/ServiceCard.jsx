import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ServiceCard({ service, setPage }) {
  const { addItem, items } = useCart();
  const { user } = useAuth();
  const inCart = items.some((i) => i.id === service.id);

  const userDiscount = user?.discount_percent || 0;
  const serviceDiscount = service.discount_percent || 0;
  const effectiveDiscount = Math.max(userDiscount, serviceDiscount);
  const discountedPrice = service.price * (1 - effectiveDiscount / 100);

  const handleAdd = () => {
    if (!user) { setPage('auth'); return; }
    addItem(service);
  };

  return (
    <div className={`service-card ${serviceDiscount > 0 ? 'has-discount' : ''}`}>
      {serviceDiscount > 0 && (
        <div className="discount-badge">−{serviceDiscount}%</div>
      )}
      <div className="service-category-tag">{service.category_name}</div>
      <h3 className="service-name">{service.name}</h3>
      <p className="service-desc">{service.description}</p>
      <div className="service-meta">
        <span className="service-duration">⏱ {service.duration_min} мин</span>
        <div className="service-price-block">
          {effectiveDiscount > 0 && (
            <span className="price-original">{Number(service.price).toLocaleString('ru-RU')} ₽</span>
          )}
          <span className="price-final">{Math.round(discountedPrice).toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>
      <button
        className={`btn-add ${inCart ? 'in-cart' : ''}`}
        onClick={handleAdd}
        disabled={inCart}
      >
        {inCart ? '✓ В корзине' : 'Добавить'}
      </button>
    </div>
  );
}
