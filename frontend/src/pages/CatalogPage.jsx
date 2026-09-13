import { useState, useEffect } from 'react';
import { getServices, getCategories } from '../api';
import ServiceCard from '../components/ServiceCard';

export default function CatalogPage({ setPage }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getServices(), getCategories()])
      .then(([svcs, cats]) => {
        setServices(svcs);
        setCategories(cats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleCat = (id) =>
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const filtered = selectedCats.length
    ? services.filter((s) => selectedCats.includes(s.category_id))
    : services;

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Загружаем услуги...</p>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <div className="error-icon">⚠</div>
      <h2>Ошибка загрузки</h2>
      <p>{error}</p>
      <p className="error-hint">Убедитесь, что бэкенд запущен на порту 3001</p>
    </div>
  );

  return (
    <div className="catalog-layout">
     
      <aside className="categories-aside">
        <h2 className="aside-title">Категории</h2>
        <ul className="category-list">
          {categories.map((cat) => (
            <li key={cat.id} className="category-item">
              <label className="category-label">
                <input
                  type="checkbox"
                  checked={selectedCats.includes(cat.id)}
                  onChange={() => toggleCat(cat.id)}
                />
                <span className="checkmark" />
                <span className="cat-name">{cat.name}</span>
                <span className="cat-count">
                  ({services.filter((s) => s.category_id === cat.id).length})
                </span>
              </label>
            </li>
          ))}
        </ul>
        {selectedCats.length > 0 && (
          <button className="clear-filters" onClick={() => setSelectedCats([])}>
            Сбросить фильтры
          </button>
        )}
      </aside>

     
      <main className="catalog-main">
        <div className="catalog-header">
          <h1 className="catalog-title">Услуги</h1>
          <span className="catalog-count">{filtered.length} услуг</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>Услуги не найдены. Попробуйте изменить фильтры.</p>
          </div>
        ) : (
          <div className="services-grid">
            {filtered.map((s) => (
              <ServiceCard key={s.id} service={s} setPage={setPage} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
