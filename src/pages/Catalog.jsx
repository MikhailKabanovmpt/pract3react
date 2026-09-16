
import { useState, useEffect, useContext } from 'react';
import { getServices } from '../api';
import { CategoriesContext } from '../contexts/CategoriesContext';
import { CartContext } from '../contexts/CartContext';
import ServiceCard from '../components/ServiceCard';
import CouponInput from '../components/CouponInput';

export default function Catalog() {
  const { categories, loading: catLoading } = useContext(CategoriesContext);
  const { addToCart, couponApplied, couponDiscount, couponCode } = useContext(CartContext);

  const [services, setServices]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedCats, setSelectedCats] = useState(new Set()); 


  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (selectedCats.size === 1) params.category_id = [...selectedCats][0];
    getServices(params)
      .then(res => setServices(res.data))
      .catch(err => setError(err.response?.data?.message || 'Ошибка загрузки каталога'))
      .finally(() => setLoading(false));
  }, [selectedCats]);

  const toggleCat = (id) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  
  const filtered = selectedCats.size === 0
    ? services
    : services.filter(s => selectedCats.has(s.category_id));

  return (
    <div className="catalog-layout">
      
      <aside className="aside">
        <h3>Категории</h3>
        {catLoading ? (
          <p className="text-muted">Загрузка...</p>
        ) : (
          <div className="cat-filter">
            {categories.map(cat => (
              <label
                key={cat.id}
                className={selectedCats.has(cat.id) ? 'checked' : ''}
              >
                <input
                  type="checkbox"
                  checked={selectedCats.has(cat.id)}
                  onChange={() => toggleCat(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        )}

        <div className="aside-discount">
          <p>🎫 Промокод</p>
          {couponApplied ? (
            <div className="coupon-success">
              ✅ {couponCode} — скидка {couponDiscount}%
            </div>
          ) : (
            <CouponInput />
          )}
        </div>
      </aside>

     
      <div className="catalog-main">
        <div className="catalog-header">
          <h2>Каталог котов 🐾</h2>
          <span className="results-count">{filtered.length} позиций</span>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            Загрузка каталога...
          </div>
        )}

        {error && (
          <div className="error-banner">⚠️ {error}</div>
        )}

        {!loading && !error && (
          <div className="services-grid">
            {filtered.length === 0 ? (
              <p className="text-muted">Нет товаров в выбранных категориях</p>
            ) : (
              filtered.map(s => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  onAddToCart={() => addToCart(s)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
