-- Initial schema for Suas Economias
-- Date: 2026-02-25

-- Usuários (estende auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile when auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Contas bancárias
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,               -- Ex: "CC Bradesco", "Poup Bradesco"
  type TEXT NOT NULL,               -- 'checking', 'savings', 'investment', 'cash'
  balance NUMERIC(15,2) DEFAULT 0,
  color TEXT,                       -- cor para identificação visual
  icon TEXT,                        -- ícone da conta
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- subcategorias
  type TEXT NOT NULL,               -- 'expense', 'income', 'transfer'
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,    -- positivo = receita, negativo = despesa
  type TEXT NOT NULL,               -- 'income', 'expense', 'transfer'
  date DATE NOT NULL,
  is_consolidated BOOLEAN DEFAULT FALSE, -- se já foi efetivado/confirmado
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,             -- JSON com regra de recorrência
  recurrence_group_id UUID,        -- agrupa transações recorrentes
  installment_current INT,         -- parcela atual (ex: 12)
  installment_total INT,            -- total de parcelas (ex: 36)
  notes TEXT,
  attachment_url TEXT,
  transfer_peer_id UUID REFERENCES transactions(id), -- par da transferência
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sonhos/Objetivos financeiros
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(15,2) NOT NULL,
  current_amount NUMERIC(15,2) DEFAULT 0,
  target_date DATE,
  image_url TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orçamentos mensais
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  month INT NOT NULL,               -- 1-12
  year INT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read their own profile."
  ON profiles FOR SELECT USING (auth.uid() = id);

-- Policies for Accounts
CREATE POLICY "Users can manage their own accounts."
  ON accounts FOR ALL USING (auth.uid() = user_id);

-- Policies for Categories
CREATE POLICY "Users can manage their own categories."
  ON categories FOR ALL USING (auth.uid() = user_id);

-- Policies for Transactions
CREATE POLICY "Users can manage their own transactions."
  ON transactions FOR ALL USING (auth.uid() = user_id);

-- Policies for Goals
CREATE POLICY "Users can manage their own goals."
  ON goals FOR ALL USING (auth.uid() = user_id);

-- Policies for Budgets
CREATE POLICY "Users can manage their own budgets."
  ON budgets FOR ALL USING (auth.uid() = user_id);

-- Setup Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can update their own avatar."
  ON storage.objects FOR UPDATE
  USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar."
  ON storage.objects FOR DELETE
  USING (auth.uid() = owner);

CREATE POLICY "Users can manage their own attachments."
  ON storage.objects FOR ALL
  USING (bucket_id = 'attachments' AND auth.uid() = owner);
