-- ============================================
-- 任务管理系统 — Supabase 数据库迁移脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 账号表
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  task_name TEXT NOT NULL,
  publish_account TEXT DEFAULT '',
  advance_amount NUMERIC DEFAULT 0,
  cooperation_method TEXT DEFAULT '',
  cooperation_requirements TEXT DEFAULT '',
  product_amount NUMERIC DEFAULT 0,
  manuscript_fee NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  handling_fee_rate NUMERIC DEFAULT 10,
  net_amount NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  due_date TEXT DEFAULT '',
  required_posts INTEGER DEFAULT 0,
  published_posts INTEGER DEFAULT 0,
  completion_degree INTEGER DEFAULT 0,
  completion_date TEXT,
  is_settled BOOLEAN DEFAULT false,
  settlement_date TEXT,
  is_commissioned BOOLEAN DEFAULT false,
  commission_date TEXT,
  is_advance_reimbursed BOOLEAN DEFAULT false,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 配置表
CREATE TABLE IF NOT EXISTS configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES accounts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  cooperation_methods TEXT[] DEFAULT ARRAY['寄拍', '置换', '报备', '纯佣', '专场', '包月'],
  cooperation_requirements TEXT[] DEFAULT ARRAY['图文发布', '视频发布', '直播带货', '小红书种草', '抖音推广', '淘宝挂车', '微博转发', '微信推文'],
  publish_accounts TEXT[] DEFAULT ARRAY['小红书-主号', '抖音-主号', '微博-主号', 'B站-主号'],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_configs_user_id ON configs(user_id);

-- 6. 插入默认管理员账号 (密码: ai561695，SHA-256 哈希)
INSERT INTO accounts (username, password_hash, is_admin) VALUES 
  ('aijie', encode(digest('ai561695', 'sha256'), 'hex'), true)
ON CONFLICT (username) DO NOTHING;

-- 7. 插入管理员默认配置
INSERT INTO configs (user_id)
SELECT id FROM accounts WHERE username = 'aijie'
ON CONFLICT (user_id) DO NOTHING;

-- 8. 关闭 RLS（行级安全）- 本项目使用 anon key 公开访问，无需 RLS 策略
ALTER TABLE IF EXISTS accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configs DISABLE ROW LEVEL SECURITY;
