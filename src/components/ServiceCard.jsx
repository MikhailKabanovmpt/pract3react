
export default function ServiceCard({ service, onAddToCart }) {
  const { name, description, duration, price, discount_percent, icon, category_name } = service;
  const discPct = discount_percent || 0;
  const finalPrice = discPct > 0 ? Math.round(price * (1 - discPct / 100)) : price;
  const fmt = (n) => n.toLocaleString('ru-RU') + ' ₽';

  return (
    <div className="service-card">
      <div className="card-img">{icon || '🐱'}</div>
      <div className="card-body">
        <span className="card-cat-tag">{category_name}</span>
        <div className="card-name">{name}</div>
        <div className="card-desc">{description}</div>
        {duration && <div className="card-meta">⏱ {duration}</div>}
      </div>
      <div className="card-footer">
        <div className="price-block">
          {discPct > 0 && (
            <>
              <span className="price-orig">{fmt(price)}</span>
              <span className="discount-badge">-{discPct}%</span>
            </>
          )}
          <span className={discPct > 0 ? 'price-final' : 'price-nodiscount'}>
            {fmt(finalPrice)}
          </span>
        </div>
        <button className="add-btn" onClick={onAddToCart}>В корзину</button>
      </div>
    </div>
  );
}
