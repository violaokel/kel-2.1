-- ====================================================================
-- SCRIPT DE CONFIGURAÇÃO DE BANCO DE DADOS E POLÍTICAS RLS (SUPABASE)
-- Sistema Municipal de Controle de Estoque de Alimentos - KEL
-- ====================================================================
--
-- INSTRUÇÕES DE USO:
-- 1. Acesse o seu painel do Supabase (https://supabase.com).
-- 2. Vá em "SQL Editor" no menu lateral esquerdo (ícone de folha com código).
-- 3. Clique em "New Query" (Nova Consulta).
-- 4. Cole TODO o conteúdo deste arquivo e clique no botão "Run" (Executar).
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Criação da Tabela Unificada de Sincronização (Estado Offline-First)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kel_app_store (
    key text PRIMARY KEY,
    val jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.kel_app_store IS 'Armazenamento de estado off-line unificado para sincronização direta do cliente.';
COMMENT ON COLUMN public.kel_app_store.key IS 'A chave de identificação do recurso (Ex: products, school_menus, transactions, logs, user_accounts).';
COMMENT ON COLUMN public.kel_app_store.val IS 'O documento JSONB contendo o array completo de registros da chave correspondente.';

-- Ativar RLS para a tabela de sincronização
ALTER TABLE public.kel_app_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.kel_app_store;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.kel_app_store;

CREATE POLICY "Permitir leitura para todos" ON public.kel_app_store FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.kel_app_store FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 2. Criação das Tabelas Relacionais Individuais Solicitadas
-- --------------------------------------------------------------------

-- A) Tabela de Produtos (Estoque)
CREATE TABLE IF NOT EXISTS public.products (
    id text PRIMARY KEY,
    name text NOT NULL,
    barcode text,
    category text,
    quantity numeric DEFAULT 0,
    min_quantity numeric DEFAULT 0,
    unit text,
    expiry_date text,
    supplier text,
    location text,
    wastage numeric DEFAULT 0,
    image text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B) Tabela de Cardápios Escolares
CREATE TABLE IF NOT EXISTS public.school_menus (
    id text PRIMARY KEY,
    name text NOT NULL,
    meal_type text,
    date text,
    ingredients jsonb DEFAULT '[]'::jsonb,
    portions_count integer DEFAULT 0,
    served boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C) Tabela de Transações de Entrada, Saída e Desperdício
CREATE TABLE IF NOT EXISTS public.transactions (
    id text PRIMARY KEY,
    product_id text,
    product_name text,
    type text,
    quantity numeric DEFAULT 0,
    unit text,
    date text,
    user_name text,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D) Tabela de Contas de Usuários Registrados
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id text PRIMARY KEY,
    username text UNIQUE NOT NULL,
    role text,
    name text,
    password text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E) Tabela de Histórico de Logs de Atividades (Auditoria)
CREATE TABLE IF NOT EXISTS public.logs (
    id text PRIMARY KEY,
    timestamp text,
    user_name text,
    role text,
    action text,
    details text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 3. Ativação de Row Level Security (RLS) para as Tabelas Relacionais
-- --------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre (Leitura e Escrita) para uso direto ou sincronizado
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.products;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.products;
CREATE POLICY "Permitir leitura para todos" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.school_menus;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.school_menus;
CREATE POLICY "Permitir leitura para todos" ON public.school_menus FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.school_menus FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.transactions;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.transactions;
CREATE POLICY "Permitir leitura para todos" ON public.transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.user_accounts;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.user_accounts;
CREATE POLICY "Permitir leitura para todos" ON public.user_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.user_accounts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.logs;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.logs;
CREATE POLICY "Permitir leitura para todos" ON public.logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 4. Função Trigger de Sincronização Unidirecional Automática (Tempo Real)
-- --------------------------------------------------------------------
-- Esta função é disparada automaticamente no Supabase sempre que a tabela unificada
-- `kel_app_store` sofre alteração. Ela extrai os arrays JSON e os distribui
-- perfeitamente nas tabelas relacionais em tempo real, mantendo os dados normalizados.

CREATE OR REPLACE FUNCTION public.sync_kel_app_store_to_relational_tables()
RETURNS TRIGGER AS $$
BEGIN
    -- Sincronizar Produtos
    IF NEW.key = 'products' THEN
        -- Limpa registros excluídos do cliente
        DELETE FROM public.products WHERE id NOT IN (
            SELECT (elem->>'id') FROM jsonb_array_elements(NEW.val) AS elem
        );
        
        -- Atualiza ou insere novos registros
        INSERT INTO public.products (
            id, name, barcode, category, quantity, min_quantity, unit, expiry_date, supplier, location, wastage, image, updated_at
        )
        SELECT 
            (elem->>'id') AS id,
            COALESCE(elem->>'name', 'Produto Sem Nome') AS name,
            COALESCE(elem->>'barcode', '') AS barcode,
            COALESCE(elem->>'category', 'Sem Categoria') AS category,
            COALESCE((elem->>'quantity')::numeric, 0) AS quantity,
            COALESCE((elem->>'minQuantity')::numeric, 0) AS min_quantity,
            COALESCE(elem->>'unit', 'unidade') AS unit,
            COALESCE(elem->>'expiryDate', '') AS expiry_date,
            COALESCE(elem->>'supplier', '') AS supplier,
            COALESCE(elem->>'location', '') AS location,
            COALESCE((elem->>'wastage')::numeric, 0) AS wastage,
            elem->>'image' AS image,
            timezone('utc'::text, now())
        FROM jsonb_array_elements(NEW.val) AS elem
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            barcode = EXCLUDED.barcode,
            category = EXCLUDED.category,
            quantity = EXCLUDED.quantity,
            min_quantity = EXCLUDED.min_quantity,
            unit = EXCLUDED.unit,
            expiry_date = EXCLUDED.expiry_date,
            supplier = EXCLUDED.supplier,
            location = EXCLUDED.location,
            wastage = EXCLUDED.wastage,
            image = EXCLUDED.image,
            updated_at = timezone('utc'::text, now());

    -- Sincronizar Cardápios
    ELSIF NEW.key = 'school_menus' THEN
        DELETE FROM public.school_menus WHERE id NOT IN (
            SELECT (elem->>'id') FROM jsonb_array_elements(NEW.val) AS elem
        );
        
        INSERT INTO public.school_menus (
            id, name, meal_type, date, ingredients, portions_count, served, updated_at
        )
        SELECT 
            (elem->>'id') AS id,
            COALESCE(elem->>'name', 'Cardápio Sem Nome') AS name,
            COALESCE(elem->>'mealType', 'almoco') AS meal_type,
            COALESCE(elem->>'date', '') AS date,
            COALESCE(elem->'ingredients', '[]'::jsonb) AS ingredients,
            COALESCE((elem->>'portionsCount')::integer, 0) AS portions_count,
            COALESCE((elem->>'served')::boolean, false) AS served,
            timezone('utc'::text, now())
        FROM jsonb_array_elements(NEW.val) AS elem
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            meal_type = EXCLUDED.meal_type,
            date = EXCLUDED.date,
            ingredients = EXCLUDED.ingredients,
            portions_count = EXCLUDED.portions_count,
            served = EXCLUDED.served,
            updated_at = timezone('utc'::text, now());

    -- Sincronizar Transações de Estoque
    ELSIF NEW.key = 'transactions' THEN
        DELETE FROM public.transactions WHERE id NOT IN (
            SELECT (elem->>'id') FROM jsonb_array_elements(NEW.val) AS elem
        );
        
        INSERT INTO public.transactions (
            id, product_id, product_name, type, quantity, unit, date, user_name, notes, updated_at
        )
        SELECT 
            (elem->>'id') AS id,
            COALESCE(elem->>'productId', '') AS product_id,
            COALESCE(elem->>'productName', '') AS product_name,
            COALESCE(elem->>'type', 'entrada') AS type,
            COALESCE((elem->>'quantity')::numeric, 0) AS quantity,
            COALESCE(elem->>'unit', '') AS unit,
            COALESCE(elem->>'date', '') AS date,
            COALESCE(elem->>'user', '') AS user_name,
            COALESCE(elem->>'notes', '') AS notes,
            timezone('utc'::text, now())
        FROM jsonb_array_elements(NEW.val) AS elem
        ON CONFLICT (id) DO UPDATE SET
            product_id = EXCLUDED.product_id,
            product_name = EXCLUDED.product_name,
            type = EXCLUDED.type,
            quantity = EXCLUDED.quantity,
            unit = EXCLUDED.unit,
            date = EXCLUDED.date,
            user_name = EXCLUDED.user_name,
            notes = EXCLUDED.notes,
            updated_at = timezone('utc'::text, now());

    -- Sincronizar Contas de Usuários
    ELSIF NEW.key = 'user_accounts' THEN
        DELETE FROM public.user_accounts WHERE id NOT IN (
            SELECT (elem->>'id') FROM jsonb_array_elements(NEW.val) AS elem
        );
        
        INSERT INTO public.user_accounts (
            id, username, role, name, password, updated_at
        )
        SELECT 
            (elem->>'id') AS id,
            COALESCE(elem->>'username', '') AS username,
            COALESCE(elem->>'role', 'Coordenadora da Merenda Escolar') AS role,
            COALESCE(elem->>'name', '') AS name,
            elem->>'password' AS password,
            timezone('utc'::text, now())
        FROM jsonb_array_elements(NEW.val) AS elem
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            role = EXCLUDED.role,
            name = EXCLUDED.name,
            password = EXCLUDED.password,
            updated_at = timezone('utc'::text, now());

    -- Sincronizar Logs de Auditoria
    ELSIF NEW.key = 'logs' THEN
        DELETE FROM public.logs WHERE id NOT IN (
            SELECT (elem->>'id') FROM jsonb_array_elements(NEW.val) AS elem
        );
        
        INSERT INTO public.logs (
            id, timestamp, user_name, role, action, details, updated_at
        )
        SELECT 
            (elem->>'id') AS id,
            COALESCE(elem->>'timestamp', '') AS timestamp,
            COALESCE(elem->>'user', '') AS user_name,
            COALESCE(elem->>'role', '') AS role,
            COALESCE(elem->>'action', '') AS action,
            COALESCE(elem->>'details', '') AS details,
            timezone('utc'::text, now())
        FROM jsonb_array_elements(NEW.val) AS elem
        ON CONFLICT (id) DO UPDATE SET
            timestamp = EXCLUDED.timestamp,
            user_name = EXCLUDED.user_name,
            role = EXCLUDED.role,
            action = EXCLUDED.action,
            details = EXCLUDED.details,
            updated_at = timezone('utc'::text, now());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar o Trigger de Descompactação Automática
DROP TRIGGER IF EXISTS trigger_sync_kel_app_store ON public.kel_app_store;
CREATE TRIGGER trigger_sync_kel_app_store
    AFTER INSERT OR UPDATE ON public.kel_app_store
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_kel_app_store_to_relational_tables();

-- --------------------------------------------------------------------
-- 5. Atualização Automática do campo `updated_at` (Boas Práticas de Banco)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_updated_at ON public.kel_app_store;
CREATE TRIGGER trigger_handle_updated_at BEFORE UPDATE ON public.kel_app_store FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------------------
-- 6. Habilitar Replicação de Tempo Real (Realtime) para Sincronização Instantânea
-- --------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        -- Adicionar kel_app_store
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'kel_app_store' AND schemaname = 'public'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.kel_app_store;
        END IF;

        -- Adicionar products
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'products' AND schemaname = 'public'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
        END IF;

        -- Adicionar school_menus
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'school_menus' AND schemaname = 'public'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.school_menus;
        END IF;

        -- Adicionar transactions
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'transactions' AND schemaname = 'public'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
        END IF;

        -- Adicionar user_accounts
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'user_accounts' AND schemaname = 'public'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.user_accounts;
        END IF;

        -- Adicionar logs
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'logs' AND schemaname = 'public'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
