import { useState, useEffect } from 'react';
import {
  getUsers, getServices, getCategories, getAppointments,
  createCategory, deleteCategory,
  createService, updateService, deleteService,
  setUserDiscount, setServiceDiscount,
  updateAppointmentStatus,
} from '../api';

export default function AdminPage() {
  const [tab, setTab] = useState('services');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  const [newCat, setNewCat] = useState('');
  const [svcForm, setSvcForm] = useState({ name: '', description: '', duration_min: 60, price: '', category_id: '', discount_percent: 0 });
  const [editSvc, setEditSvc] = useState(null);
  const [discForm, setDiscForm] = useState({ userId: '', coupon_code: '', discount_percent: 0 });

  const load = () => {
    setLoading(true);
    Promise.all([getServices(), getCategories(), getUsers(), getAppointments()])
      .then(([svcs, cats, usrs, appts]) => {
        setServices(svcs); setCategories(cats); setUsers(usrs); setAppointments(appts);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAddCat = async () => {
    if (!newCat.trim()) return;
    try { await createCategory(newCat); setNewCat(''); load(); } catch (e) { alert(e.message); }
  };

  const handleDelCat = async (id) => {
    if (!confirm('Удалить категорию?')) return;
    try { await deleteCategory(id); load(); } catch (e) { alert(e.message); }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      await createService(svcForm);
      setSvcForm({ name: '', description: '', duration_min: 60, price: '', category_id: '', discount_percent: 0 });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try { await updateService(editSvc.id, editSvc); setEditSvc(null); load(); }
    catch (e) { alert(e.message); }
  };

  const handleDelService = async (id) => {
    if (!confirm('Удалить услугу?')) return;
    try { await deleteService(id); load(); } catch (e) { alert(e.message); }
  };

  const handleSetDiscount = async (e) => {
    e.preventDefault();
    try { await setUserDiscount(discForm); alert('Скидка назначена'); load(); }
    catch (e) { alert(e.message); }
  };

  const handleSvcDiscount = async (id, discount) => {
    try { await setServiceDiscount({ serviceId: id, discount_percent: Number(discount) }); load(); }
    catch (e) { alert(e.message); }
  };

  const handleApptStatus = async (id, status) => {
    try { await updateAppointmentStatus(id, status); load(); }
    catch (e) { alert(e.message); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Загрузка...</p></div>;
  if (error) return <div className="error-screen"><p>{error}</p></div>;

  const tabs = [
    { id: 'services', label: 'Услуги' },
    { id: 'categories', label: 'Категории' },
    { id: 'users', label: 'Пользователи' },
    { id: 'appointments', label: 'Записи' },
  ];

  return (
    <div className="admin-page">
      <h1 className="page-title">Панель администратора</h1>

      <div className="admin-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`atab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

     
      {tab === 'services' && (
        <div className="admin-section">
          <h2>Управление услугами</h2>
          <form className="admin-form" onSubmit={editSvc ? handleUpdateService : handleAddService}>
            <h3>{editSvc ? 'Редактировать' : 'Добавить услугу'}</h3>
            <div className="form-row">
              <input placeholder="Название" value={editSvc ? editSvc.name : svcForm.name}
                onChange={(e) => editSvc ? setEditSvc({ ...editSvc, name: e.target.value }) : setSvcForm({ ...svcForm, name: e.target.value })} required />
              <input type="number" placeholder="Цена ₽" value={editSvc ? editSvc.price : svcForm.price}
                onChange={(e) => editSvc ? setEditSvc({ ...editSvc, price: e.target.value }) : setSvcForm({ ...svcForm, price: e.target.value })} required />
              <input type="number" placeholder="Длительность мин" value={editSvc ? editSvc.duration_min : svcForm.duration_min}
                onChange={(e) => editSvc ? setEditSvc({ ...editSvc, duration_min: e.target.value }) : setSvcForm({ ...svcForm, duration_min: e.target.value })} />
            </div>
            <div className="form-row">
              <textarea placeholder="Описание" value={editSvc ? editSvc.description : svcForm.description}
                onChange={(e) => editSvc ? setEditSvc({ ...editSvc, description: e.target.value }) : setSvcForm({ ...svcForm, description: e.target.value })} />
              <select value={editSvc ? editSvc.category_id : svcForm.category_id}
                onChange={(e) => editSvc ? setEditSvc({ ...editSvc, category_id: e.target.value }) : setSvcForm({ ...svcForm, category_id: e.target.value })}>
                <option value="">— Категория —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" placeholder="Скидка %" min="0" max="100"
                value={editSvc ? editSvc.discount_percent : svcForm.discount_percent}
                onChange={(e) => editSvc ? setEditSvc({ ...editSvc, discount_percent: e.target.value }) : setSvcForm({ ...svcForm, discount_percent: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">{editSvc ? 'Сохранить' : 'Добавить'}</button>
              {editSvc && <button type="button" className="btn-secondary" onClick={() => setEditSvc(null)}>Отмена</button>}
            </div>
          </form>

          <table className="admin-table">
            <thead><tr><th>Услуга</th><th>Категория</th><th>Цена</th><th>Скидка %</th><th>Действия</th></tr></thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.category_name || '—'}</td>
                  <td>{Number(s.price).toLocaleString('ru-RU')} ₽</td>
                  <td>
                    <input type="number" min="0" max="100" defaultValue={s.discount_percent}
                      onBlur={(e) => handleSvcDiscount(s.id, e.target.value)}
                      className="discount-input" />
                  </td>
                  <td className="td-actions">
                    <button className="btn-edit" onClick={() => setEditSvc({ ...s })}>✏</button>
                    <button className="btn-del" onClick={() => handleDelService(s.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

     
      {tab === 'categories' && (
        <div className="admin-section">
          <h2>Категории услуг</h2>
          <div className="add-cat-row">
            <input placeholder="Новая категория" value={newCat} onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCat()} />
            <button className="btn-primary" onClick={handleAddCat}>Добавить</button>
          </div>
          <div className="cat-chips">
            {categories.map((c) => (
              <div key={c.id} className="cat-chip">
                <span>{c.name}</span>
                <button onClick={() => handleDelCat(c.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      
      {tab === 'users' && (
        <div className="admin-section">
          <h2>Пользователи и скидки</h2>
          <form className="admin-form" onSubmit={handleSetDiscount}>
            <h3>Назначить персональную скидку</h3>
            <div className="form-row">
              <select value={discForm.userId} onChange={(e) => setDiscForm({ ...discForm, userId: e.target.value })} required>
                <option value="">— Выберите пользователя —</option>
                {users.filter((u) => u.role !== 'admin').map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <input placeholder="Код купона (напр. SAVE20)" value={discForm.coupon_code}
                onChange={(e) => setDiscForm({ ...discForm, coupon_code: e.target.value })} />
              <input type="number" placeholder="Скидка %" min="0" max="100" value={discForm.discount_percent}
                onChange={(e) => setDiscForm({ ...discForm, discount_percent: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary">Назначить</button>
          </form>

          <table className="admin-table">
            <thead><tr><th>Имя</th><th>Email</th><th>Роль</th><th>Купон</th><th>Скидка</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td>{u.coupon_code || '—'}</td>
                  <td>{u.discount_percent ? `${u.discount_percent}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      
      {tab === 'appointments' && (
        <div className="admin-section">
          <h2>Все записи</h2>
          <table className="admin-table">
            <thead><tr><th>Клиент</th><th>Услуга</th><th>Дата</th><th>Статус</th></tr></thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.client_name}</td>
                  <td>{a.service_name}</td>
                  <td>{new Date(a.appointment_time).toLocaleString('ru-RU')}</td>
                  <td>
                    <select value={a.status} onChange={(e) => handleApptStatus(a.id, e.target.value)}>
                      <option value="pending">Ожидает</option>
                      <option value="confirmed">Подтверждено</option>
                      <option value="completed">Завершено</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
