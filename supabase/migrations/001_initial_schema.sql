-- ============================================================
-- 001_initial_schema.sql - Khởi tạo cơ sở dữ liệu ban đầu
-- Music Journey 2D | Giai đoạn 4: Tài khoản & Bảo mật
-- Chạy trên Supabase SQL Editor hoặc CLI: supabase db push
-- ============================================================

-- Bảng: profiles (thông tin hồ sơ người dùng)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng: inventory (vật phẩm đã sở hữu)
CREATE TABLE IF NOT EXISTS public.inventory (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_type   TEXT CHECK (item_type IN ('vehicle', 'environment')) NOT NULL,
  item_id     TEXT NOT NULL,  -- Khớp với id trong vehicles.ts / environments.ts
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_id)   -- Không mua trùng vật phẩm
);

-- Bảng: subscriptions (gói hội viên)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan        TEXT CHECK (plan IN ('1month', '3month', '6month')) NOT NULL,
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN GENERATED ALWAYS AS (expires_at > NOW()) STORED
);

-- Bảng: purchases (lịch sử giao dịch)
CREATE TABLE IF NOT EXISTS public.purchases (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id          TEXT NOT NULL,
  amount           INTEGER NOT NULL,   -- Đơn vị: VND (tránh float)
  currency         TEXT DEFAULT 'VND',
  status           TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'momo')) NOT NULL,
  payment_intent_id TEXT,             -- ID từ Stripe / MoMo để đối soát
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS): Người dùng chỉ thấy dữ liệu của mình
-- ============================================================
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases    ENABLE ROW LEVEL SECURITY;

-- Policy: profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policy: inventory
CREATE POLICY "Users can view own inventory"
  ON public.inventory FOR SELECT USING (auth.uid() = user_id);

-- Policy: subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Policy: purchases
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Dữ liệu mặc định: Van và Bãi biển miễn phí cho mọi user mới
-- (Trigger tự động chạy khi user đăng ký)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tạo profile
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1));

  -- Tặng Van + Bãi biển miễn phí
  INSERT INTO public.inventory (user_id, item_type, item_id)
  VALUES
    (NEW.id, 'vehicle', 'van'),
    (NEW.id, 'environment', 'beach');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
