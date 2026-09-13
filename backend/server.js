const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'salon_db',
  port: process.env.PG_PORT || 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'salon_secret_key_2024';


const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Токен отсутствует' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Неверный токен' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
  next();
};


app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email уже используется' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users(name, email, password_hash, role_id) VALUES($1,$2,$3,(SELECT id FROM roles WHERE name=\'client\')) RETURNING id, name, email',
      [name, email, hash]
    );
    const user = result.rows[0];
    const role = 'client';
    const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user, role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`, [email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Неверный email или пароль' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role, u.coupon_code, u.discount_percent
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id=$1`, [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/categories', authMiddleware, adminMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Название категории обязательно' });
  try {
    const result = await pool.query('INSERT INTO categories(name) VALUES($1) RETURNING *', [name]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/categories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/services', async (req, res) => {
  try {
    const { category } = req.query;
    let q = `SELECT s.*, c.name AS category_name FROM services s
             LEFT JOIN categories c ON s.category_id = c.id`;
    const params = [];
    if (category) { q += ' WHERE s.category_id = $1'; params.push(category); }
    q += ' ORDER BY s.name';
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/services', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, description, duration_min, price, category_id, discount_percent } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Название и цена обязательны' });
  try {
    const result = await pool.query(
      `INSERT INTO services(name, description, duration_min, price, category_id, discount_percent)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, description, duration_min || 60, price, category_id, discount_percent || 0]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/services/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, description, duration_min, price, category_id, discount_percent } = req.body;
  try {
    const result = await pool.query(
      `UPDATE services SET name=$1, description=$2, duration_min=$3, price=$4,
       category_id=$5, discount_percent=$6 WHERE id=$7 RETURNING *`,
      [name, description, duration_min, price, category_id, discount_percent, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/services/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.post('/api/admin/user-discount', authMiddleware, adminMiddleware, async (req, res) => {
  const { userId, coupon_code, discount_percent } = req.body;
  try {
    await pool.query(
      'UPDATE users SET coupon_code=$1, discount_percent=$2 WHERE id=$3',
      [coupon_code, discount_percent, userId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/admin/service-discount', authMiddleware, adminMiddleware, async (req, res) => {
  const { serviceId, discount_percent } = req.body;
  try {
    await pool.query('UPDATE services SET discount_percent=$1 WHERE id=$2', [discount_percent, serviceId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/appointments', authMiddleware, async (req, res) => {
  try {
    let q = `SELECT a.*, u.name AS client_name, u.email AS client_email, s.name AS service_name
             FROM appointments a
             JOIN users u ON a.user_id = u.id
             JOIN services s ON a.service_id = s.id`;
    const params = [];
    if (req.user.role !== 'admin') {
      q += ' WHERE a.user_id=$1';
      params.push(req.user.id);
    }
    q += ' ORDER BY a.created_at DESC';
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/appointments', authMiddleware, async (req, res) => {
  const { service_id, appointment_time, notes } = req.body;
  if (!service_id || !appointment_time) return res.status(400).json({ error: 'Укажите услугу и время' });
  try {
    const result = await pool.query(
      `INSERT INTO appointments(user_id, service_id, appointment_time, notes)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [req.user.id, service_id, appointment_time, notes]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/appointments/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.post('/api/payments', authMiddleware, async (req, res) => {
  const { appointment_id, amount, method } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO payments(appointment_id, amount, method, status)
       VALUES($1,$2,$3,'completed') RETURNING *`,
      [appointment_id, amount, method || 'card']
    );
    await pool.query('UPDATE appointments SET status=\'confirmed\' WHERE id=$1', [appointment_id]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role, u.coupon_code, u.discount_percent, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
