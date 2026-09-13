-- ═══════════════════════════════════════════════════════
--  Beauty Salon — PostgreSQL schema + seed data
-- ═══════════════════════════════════════════════════════

-- Drop & recreate tables (safe for dev)
DROP TABLE IF EXISTS payments       CASCADE;
DROP TABLE IF EXISTS appointments   CASCADE;
DROP TABLE IF EXISTS services       CASCADE;
DROP TABLE IF EXISTS categories     CASCADE;
DROP TABLE IF EXISTS users          CASCADE;
DROP TABLE IF EXISTS roles          CASCADE;

-- ── Roles ─────────────────────────────────────────────
CREATE TABLE roles (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles(name) VALUES ('admin'), ('client');

-- ── Users ─────────────────────────────────────────────
CREATE TABLE users (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(150) UNIQUE NOT NULL,
  password_hash    TEXT        NOT NULL,
  role_id          INT         NOT NULL REFERENCES roles(id),
  coupon_code      VARCHAR(50),
  discount_percent INT         DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Admin seed (password: admin123)
INSERT INTO users(name, email, password_hash, role_id)
VALUES (
  'Администратор',
  'admin@salon.ru',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password
  (SELECT id FROM roles WHERE name = 'admin')
);

-- Demo client seed (password: client123)
INSERT INTO users(name, email, password_hash, role_id, coupon_code, discount_percent)
VALUES (
  'Мария Иванова',
  'client@salon.ru',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password
  (SELECT id FROM roles WHERE name = 'client'),
  'WELCOME10',
  10
);

-- ── Categories ─────────────────────────────────────────
CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO categories(name) VALUES
  ('Волосы'),
  ('Маникюр'),
  ('Педикюр'),
  ('Уход за лицом'),
  ('Массаж'),
  ('Макияж');

-- ── Services ──────────────────────────────────────────
CREATE TABLE services (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  description      TEXT,
  duration_min     INT         NOT NULL DEFAULT 60,
  price            NUMERIC(10,2) NOT NULL,
  category_id      INT         REFERENCES categories(id),
  discount_percent INT         DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO services(name, description, duration_min, price, category_id, discount_percent) VALUES
  ('Стрижка женская',        'Модельная стрижка с укладкой', 60, 1800, (SELECT id FROM categories WHERE name='Волосы'), 0),
  ('Стрижка мужская',        'Классическая мужская стрижка', 45, 1200, (SELECT id FROM categories WHERE name='Волосы'), 0),
  ('Окрашивание волос',      'Однотонное окрашивание + уход', 120, 4500, (SELECT id FROM categories WHERE name='Волосы'), 30),
  ('Мелирование',            'Классическое мелирование', 150, 5500, (SELECT id FROM categories WHERE name='Волосы'), 0),
  ('Кератиновое выпрямление','Процедура разглаживания волос', 180, 7000, (SELECT id FROM categories WHERE name='Волосы'), 30),
  ('Маникюр классический',   'Обрезной маникюр с покрытием', 60, 1500, (SELECT id FROM categories WHERE name='Маникюр'), 0),
  ('Маникюр аппаратный',     'Аппаратный маникюр + гель-лак', 75, 2000, (SELECT id FROM categories WHERE name='Маникюр'), 30),
  ('Педикюр классический',   'Обрезной педикюр с покрытием', 90, 2200, (SELECT id FROM categories WHERE name='Педикюр'), 0),
  ('Педикюр аппаратный',     'Аппаратный педикюр + гель-лак', 100, 2800, (SELECT id FROM categories WHERE name='Педикюр'), 30),
  ('Чистка лица',            'Ультразвуковая чистка', 60, 3000, (SELECT id FROM categories WHERE name='Уход за лицом'), 0),
  ('Омолаживающая маска',    'Питательная маска с сывороткой', 45, 2500, (SELECT id FROM categories WHERE name='Уход за лицом'), 30),
  ('Классический массаж',    'Расслабляющий массаж тела', 60, 3500, (SELECT id FROM categories WHERE name='Массаж'), 0),
  ('Антицеллюлитный массаж', 'Интенсивный антицеллюлитный', 60, 4000, (SELECT id FROM categories WHERE name='Массаж'), 30),
  ('Дневной макияж',         'Лёгкий дневной макияж', 45, 2000, (SELECT id FROM categories WHERE name='Макияж'), 0),
  ('Вечерний макияж',        'Стрелки, smoky, объём', 60, 2800, (SELECT id FROM categories WHERE name='Макияж'), 30);

-- ── Appointments ──────────────────────────────────────
CREATE TABLE appointments (
  id               SERIAL PRIMARY KEY,
  user_id          INT         NOT NULL REFERENCES users(id),
  service_id       INT         NOT NULL REFERENCES services(id),
  appointment_time TIMESTAMPTZ NOT NULL,
  status           VARCHAR(50) DEFAULT 'pending',  -- pending | confirmed | completed | cancelled
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payments ──────────────────────────────────────────
CREATE TABLE payments (
  id             SERIAL PRIMARY KEY,
  appointment_id INT           NOT NULL REFERENCES appointments(id),
  amount         NUMERIC(10,2) NOT NULL,
  method         VARCHAR(50)   DEFAULT 'card',  -- card | cash
  status         VARCHAR(50)   DEFAULT 'pending', -- pending | completed | refunded
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);
