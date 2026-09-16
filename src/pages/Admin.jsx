
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { CategoriesContext } from '../contexts/CategoriesContext';
import { getUsers, assignCoupon, setServiceDiscount, getServices } from '../api';

export default function Admin() {
  const { user, isAdmin } = useContext(AuthContext);
  const { categories, addCategory } = useContext(CategoriesContext);
  const navigate = useNavigate();

  const [tab, setTab] = useState('users'); 
  const [users, setUsers]       = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState('');


  const [newCat, setNewCat]   = useState('');
  const [couponForm, setCouponForm] = useState({ user_id: '', code: '', discount: '' });
  const [discountForm, setDiscountForm] = useState({ service_id: '', discount: '' });

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    setLoading(true);
    Promise.all([getUsers(), getServices()])
      .then(([u, s]) => { setUsers(u.data); setServices(s.data); })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    await addCategory(newCat.trim());
    setNewCat('');
    toast('Категория добавлена ✅');
  };

  const handleAssignCoupon = async () => {
    const { user_id, code, discount } = couponForm;
    if (!user_id || !code || !discount) return toast('Заполните все поля');
    await assignCoupon(+user_id, code.toUpperCase(), +discount);
    const res = await getUsers();
    setUsers(res.data);
    setCouponForm({ user_id: '', code: '', discount: '' });
    toast(`Купон выдан ✅`);
  };

  const handleSetDiscount = async () => {
    const { service_id, discount } = discountForm;
    if (!service_id || discount === '') return toast('Заполните все поля');
    await setServiceDiscount(+service_id, +discount);
    const res = await getServices();
    setServices(res.data);
    setDiscountForm({ service_id: '', discount: '' });
    toast('Скидка обновлена ✅');
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <h2>⚙️ Панель администратора</h2>
      {msg && <div className="admin-toast">{msg}</div>}
      {loading && <div className="loading"><div className="spinner" /> Загрузка...</div>}

      <div className="admin-tabs">
        {['users', 'categories', 'discounts'].map(t => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {{ users: 'Пользователи', categories: 'Категории', discounts: 'Скидки' }[t]}
          </button>
        ))}
      </div>

     
      {tab === 'users' && (
        <div className="admin-section">
          <h3>Пользователи</h3>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Купон</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td>
                    {u.coupon_code
                      ? <span className="coupon-tag">{u.coupon_code} (-{u.coupon_discount}%)</span>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

     
      {tab === 'categories' && (
        <>
          <div className="admin-section">
            <h3>Добавить категорию</h3>
            <div className="admin-form">
              <input className="admin-input" placeholder="Название" value={newCat} onChange={e => setNewCat(e.target.value)} />
              <button className="admin-btn" onClick={handleAddCategory}>Добавить</button>
            </div>
          </div>
          <div className="admin-section">
            <h3>Все категории</h3>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Название</th><th>Slug</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td><code>{c.slug}</code></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      
      {tab === 'discounts' && (
        <>
          <div className="admin-section">
            <h3>Выдать купон пользователю</h3>
            <div className="admin-form row">
              <input className="admin-input" placeholder="ID пользователя" type="number"
                value={couponForm.user_id} onChange={e => setCouponForm(p => ({ ...p, user_id: e.target.value }))} />
              <input className="admin-input" placeholder="Код купона" value={couponForm.code}
                onChange={e => setCouponForm(p => ({ ...p, code: e.target.value }))} />
              <input className="admin-input" placeholder="Скидка %" type="number"
                value={couponForm.discount} onChange={e => setCouponForm(p => ({ ...p, discount: e.target.value }))} />
              <button className="admin-btn" onClick={handleAssignCoupon}>Выдать</button>
            </div>
          </div>
          <div className="admin-section">
            <h3>Скидка на товар</h3>
            <div className="admin-form row">
              <input className="admin-input" placeholder="ID товара" type="number"
                value={discountForm.service_id} onChange={e => setDiscountForm(p => ({ ...p, service_id: e.target.value }))} />
              <input className="admin-input" placeholder="Скидка % (0 — убрать)" type="number"
                value={discountForm.discount} onChange={e => setDiscountForm(p => ({ ...p, discount: e.target.value }))} />
              <button className="admin-btn" onClick={handleSetDiscount}>Применить</button>
            </div>
            <table className="data-table" style={{ marginTop: 16 }}>
              <thead><tr><th>ID</th><th>Товар</th><th>Цена</th><th>Скидка</th></tr></thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td><td>{s.name}</td>
                    <td>{s.price.toLocaleString('ru-RU')} ₽</td>
                    <td>{s.discount_percent > 0 ? <span className="discount-badge">-{s.discount_percent}%</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
