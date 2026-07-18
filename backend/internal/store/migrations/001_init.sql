CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goals (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  preset TEXT NOT NULL DEFAULT '',
  calories_kcal DOUBLE PRECISION NOT NULL,
  protein_g DOUBLE PRECISION NOT NULL,
  total_fat_g DOUBLE PRECISION,
  carbohydrate_g DOUBLE PRECISION,
  sugar_g DOUBLE PRECISION,
  profile_age INTEGER,
  profile_weight_kg DOUBLE PRECISION,
  profile_gender TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL,
  serving_quantity DOUBLE PRECISION NOT NULL,
  energy_kcal DOUBLE PRECISION NOT NULL,
  protein_g DOUBLE PRECISION NOT NULL,
  total_fat_g DOUBLE PRECISION NOT NULL,
  carbohydrate_g DOUBLE PRECISION NOT NULL,
  sugar_g DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS meal_logs_user_logged_at_idx ON meal_logs (user_id, logged_at);
