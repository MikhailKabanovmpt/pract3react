import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [loading, setLoading]     = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email обязателен';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Введите корректный email';
    if (!form.password) e.password = 'Пароль обязателен';
    else if (form.password.length < 6)
      e.password = 'Минимум 6 символов';
    return e;
  };

  const handleSubmit = async () => {
    setServerErr('');
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      await register({ email: form.email, password: form.password });
      navigate('/login');
    } catch (err) {
      setServerErr(err.response?.data?.error || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>📝 Регистрация</h2>
        <p className="subtitle">Создайте аккаунт КотоМаркет</p>

        {serverErr && (
          <div className="form-server-error">{serverErr}</div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            className={errors.email ? 'error' : ''}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            className={errors.password ? 'error' : ''}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        <button
          className="form-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
        </button>

        <div className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
}
