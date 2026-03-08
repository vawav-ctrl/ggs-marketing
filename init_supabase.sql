-- Supabase Schema for Marketing Asset App (v2)
-- Create exactly matching tables for our front-end app (Exact Case Match)

------------------------------------------------------
-- DROP OLD TABLES (Reset)
------------------------------------------------------
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

------------------------------------------------------
-- 1. Table: users
------------------------------------------------------
CREATE TABLE users (
    "Email" TEXT PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Role" TEXT NOT NULL CHECK ("Role" IN ('User', 'Admin'))
);

------------------------------------------------------
-- 2. Table: categories
------------------------------------------------------
CREATE TABLE categories (
    "CategoryID" TEXT PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "CoverImage" TEXT
);

------------------------------------------------------
-- 3. Table: assets
------------------------------------------------------
CREATE TABLE assets (
    "SKU" TEXT PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "ImageURL" TEXT,
    "CategoryID" TEXT REFERENCES categories("CategoryID"),
    "TotalQty" INTEGER NOT NULL DEFAULT 0,
    "AvailableQty" INTEGER NOT NULL DEFAULT 0,
    "Status" TEXT,
    "LastActive" TIMESTAMP WITH TIME ZONE,
    "Notes" TEXT
);

------------------------------------------------------
-- 4. Table: transactions
------------------------------------------------------
CREATE TABLE transactions (
    "TransID" TEXT PRIMARY KEY,
    "Email" TEXT REFERENCES users("Email"),
    "Items" JSONB NOT NULL,
    "Purpose" TEXT,
    "BorrowDate" TIMESTAMP WITH TIME ZONE,
    "ExpectedReturn" TIMESTAMP WITH TIME ZONE,
    "ActualReturn" TIMESTAMP WITH TIME ZONE,
    "Status" TEXT CHECK ("Status" IN ('Pending', 'Approved', 'Rejected', 'Returned', 'Pending Return', 'Return Rejected'))
);

------------------------------------------------------
-- Enable Row Level Security (RLS) but set to public for now
------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Users Access" ON users FOR ALL USING (true);
CREATE POLICY "Public Categories Access" ON categories FOR ALL USING (true);
CREATE POLICY "Public Assets Access" ON assets FOR ALL USING (true);
CREATE POLICY "Public Transactions Access" ON transactions FOR ALL USING (true);
