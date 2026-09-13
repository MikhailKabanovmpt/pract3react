import { useState } from 'react';
import { login, register } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ setPage }) {
  const { authLogin } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (mode === 'register' && !form.name.trim()) e.name = 'Введите имя';
    if (!form.email.trim()) e.email = 'Введите email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Некорректный email';
    if (!form.password) e.password = 'Введите пароль';
    else if (form.password.length < 6) e.password = 'Минимум 6 символов';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length) return;
    setLoading(true);
    setServerError('');
    try {
      const result = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
      authLogin(result.token, result.user);
      setPage('catalog');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">✦ BeautyLux</div>
        <h1 className="auth-title">{mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}</h1>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => { setMode('login'); setServerError(''); }}>Войти</button>
          <button className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => { setMode('register'); setServerError(''); }}>Регистрация</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="field">
              <label>Имя</label>
              <input
                type="text"
                placeholder="Ваше имя"
                value={form.name}
                onChange={set('name')}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="example@mail.ru"
              value={form.email}
              onChange={set('email')}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          {serverError && <div className="server-error">{serverError}</div>}

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-hint">
          {mode === 'login' ? 'Демо: client@salon.ru / password' : 'Администратор: admin@salon.ru / password'}
        </p>
      </div>
    </div>
  );
}
