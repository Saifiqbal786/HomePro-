-- HomePro Database Schema
-- SQLite

-- Users table (both homeowners and workers)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('homeowner', 'worker')),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    avatar TEXT,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    location TEXT,
    latitude REAL DEFAULT 0,
    longitude REAL DEFAULT 0,
    is_online INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Worker profiles (extended info for workers)
CREATE TABLE IF NOT EXISTS worker_profiles (
    id TEXT PRIMARY KEY,
    worker_id TEXT NOT NULL UNIQUE,
    bio TEXT,
    services TEXT,           -- JSON array of service categories
    skills TEXT,             -- JSON array of skills
    hourly_rate REAL NOT NULL DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    availability TEXT,       -- JSON: {days: [], hours: {start, end}}
    is_verified INTEGER DEFAULT 0,
    portfolio TEXT,          -- JSON array of image URLs
    credentials TEXT,        -- JSON array of credential strings
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tasks (jobs/bookings)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    homeowner_id TEXT NOT NULL,
    worker_id TEXT NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    location TEXT,
    scheduled_date TEXT,
    scheduled_time TEXT,
    start_time TEXT,
    end_time TEXT,
    duration_minutes INTEGER,
    hourly_rate REAL NOT NULL,
    payment_amount REAL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (homeowner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages (chat)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'system')),
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    homeowner_id TEXT NOT NULL,
    worker_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (homeowner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL UNIQUE,
    homeowner_id TEXT NOT NULL,
    worker_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'disputed')),
    created_at TEXT DEFAULT (datetime('now')),
    confirmed_at TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (homeowner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,               -- JSON with extra context
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Favorites (homeowner saves workers)
CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    homeowner_id TEXT NOT NULL,
    worker_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (homeowner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(homeowner_id, worker_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_worker_id ON worker_profiles(worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_homeowner ON tasks(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_worker ON reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_homeowner ON favorites(homeowner_id);
