import { useState, useEffect } from 'react';
import { getAppointments } from '../api';

const STATUS_LABELS = {
  pending: { label: 'Ожидает', cls: 'status-pending' },
  confirmed: { label: 'Подтверждено', cls: 'status-confirmed' },
  completed: { label: 'Завершено', cls: 'status-completed' },
  cancelled: { label: 'Отменено', cls: 'status-cancelled' },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Загружаем записи...</p>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <div className="error-icon">⚠</div>
      <p>{error}</p>
    </div>
  );

  if (appointments.length === 0) return (
    <div className="empty-state center">
      <div className="empty-icon">📅</div>
      <h2>Нет записей</h2>
      <p>Оформите запись через корзину</p>
    </div>
  );

  return (
    <div className="appointments-page">
      <h1 className="page-title">Мои записи</h1>
      <div className="appointments-list">
        {appointments.map((a) => {
          const s = STATUS_LABELS[a.status] || { label: a.status, cls: '' };
          return (
            <div key={a.id} className="appointment-card">
              <div className="appt-header">
                <h3>{a.service_name}</h3>
                <span className={`status-badge ${s.cls}`}>{s.label}</span>
              </div>
              <div className="appt-details">
                <div>📅 {new Date(a.appointment_time).toLocaleString('ru-RU')}</div>
                {a.client_name && <div>👤 {a.client_name}</div>}
                {a.notes && <div>📝 {a.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
