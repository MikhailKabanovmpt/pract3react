const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-catshop';

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

pool.on('connect', () => {
    console.log('Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к PostgreSQL:', err);
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный или просроченный токен' });
        }
        req.user = user;
        next();
    });
};

app.get('/api/services', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM services ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка запроса services:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка запроса categories:', error);
        res.json([]);
    }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.full_name, u.email, r.name AS role, u.coupon_code, u.coupon_discount
             FROM users u
             JOIN roles r ON r.id = u.role_id
             ORDER BY u.id ASC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/coupon', authenticateToken, async (req, res) => {
    const { user_id, coupon_code, coupon_discount } = req.body;
    try {
        await pool.query(
            'UPDATE users SET coupon_code = $1, coupon_discount = $2 WHERE id = $3',
            [coupon_code, coupon_discount, user_id]
        );
        res.json({ message: 'Купон успешно выдан' });
    } catch (error) {
        console.error('Ошибка выдачи купона:', error);
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/services/:id/discount', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { discount_percent } = req.body;
    try {
        const result = await pool.query(
            'UPDATE services SET discount_percent = $1 WHERE id = $2 RETURNING *',
            [discount_percent, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления скидки товара:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = userResult.rows[0];

        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role_id: user.role_id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Успешный вход',
            token,
            user: { id: user.id, email: user.email, role_id: user.role_id }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    const { name } = req.body;
    try {
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Название категории обязательно' });
        }

        const slug = name.trim().toLowerCase().replace(/\s+/g, '-');

        const result = await pool.query(
            'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *',
            [name.trim(), slug]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания категории:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id, email, role_id',
            [email, password, 2]
        );

        res.status(201).json({ message: 'Регистрация успешна', user: result.rows[0] });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
    const { items, coupon_code } = req.body;
    const userId = req.user.id;

    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Корзина пуста' });
        }

        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];

        let couponDiscountPercent = 0;
        if (coupon_code && user && user.coupon_code && user.coupon_code.toUpperCase() === coupon_code.trim().toUpperCase()) {
            couponDiscountPercent = Number(user.coupon_discount) || 0;
        }

        let totalAmount = 0;
        const calculatedItems = [];

        for (const item of items) {
            const serviceRes = await pool.query('SELECT * FROM services WHERE id = $1', [item.service_id]);
            if (serviceRes.rows.length === 0) {
                return res.status(404).json({ error: `Товар с id ${item.service_id} не найден` });
            }

            const service = serviceRes.rows[0];
            const basePrice = Number(service.price);
            const quantity = Number(item.quantity) || 1;

            const serviceDiscount = Number(service.discount_percent) || 0;
            const effectiveDiscount = Math.max(serviceDiscount, couponDiscountPercent);

            const finalUnitPrice = basePrice * (1 - effectiveDiscount / 100);
            totalAmount += finalUnitPrice * quantity;

            calculatedItems.push({
                service_id: service.id,
                quantity: quantity,
                unit_price: basePrice,
                discount_percent: effectiveDiscount
            });
        }

        const appointmentResult = await pool.query(
            'INSERT INTO appointments (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
            [userId, totalAmount, 'pending']
        );
        const appointmentId = appointmentResult.rows[0].id;

        for (const ci of calculatedItems) {
            await pool.query(
                'INSERT INTO appointment_items (appointment_id, service_id, quantity, unit_price, discount_percent) VALUES ($1, $2, $3, $4, $5)',
                [appointmentId, ci.service_id, ci.quantity, ci.unit_price, ci.discount_percent]
            );
        }

        res.status(201).json({
            message: 'Заказ успешно оформлен',
            appointmentId,
            totalAmount
        });
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/appointments/my', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT a.*,
                    json_agg(json_build_object(
                        'service_id', ai.service_id,
                        'quantity', ai.quantity,
                        'unit_price', ai.unit_price,
                        'service_name', s.name
                    )) as items
             FROM appointments a
             LEFT JOIN appointment_items ai ON a.id = ai.appointment_id
             LEFT JOIN services s ON ai.service_id = s.id
             WHERE a.user_id = $1
             GROUP BY a.id
             ORDER BY a.created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT id, email, role_id FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(userResult.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/coupons/validate', authenticateToken, async (req, res) => {
    const { code } = req.body;
    const userId = req.user.id;

    try {
        if (!code || !code.trim()) {
            return res.status(400).json({ error: 'Введите код купона' });
        }

        const userRes = await pool.query(
            'SELECT coupon_code, coupon_discount FROM users WHERE id = $1',
            [userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const user = userRes.rows[0];

        if (!user.coupon_code || user.coupon_code.toUpperCase() !== code.trim().toUpperCase()) {
            return res.status(400).json({ error: 'Неверный или недействительный купон' });
        }

        res.json({
            valid: true,
            code: user.coupon_code,
            discount_percent: user.coupon_discount
        });
    } catch (error) {
        console.error('Ошибка валидации купона:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});