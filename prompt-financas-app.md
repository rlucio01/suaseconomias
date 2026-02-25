# Prompt: Web App de Gerenciamento de Finanças Pessoais

## Visão Geral

Crie um **web app responsivo de gerenciamento de finanças pessoais** inspirado no Minhas Economias, com design moderno, refinado e profissional. A paleta de cores principal deve usar **verde escuro como cor primária** (menus, botões de ação, destaques), fundo branco/cinza claro para o conteúdo, e vermelho para valores negativos/saídas.

---

## Stack Técnica

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend/Banco de dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth (email/senha + OAuth Google)
- **Storage**: Supabase Storage (avatares, comprovantes)
- **Deploy**: Vercel
- **Gráficos**: Recharts
- **Formulários**: React Hook Form + Zod
- **Estado global**: Zustand ou React Context
- **Datas**: date-fns (com locale pt-BR)

---

## Estrutura do Banco de Dados (Supabase)

### Tabelas

```sql
-- Usuários (estende auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas bancárias
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id), -- subcategorias
  type TEXT NOT NULL,               -- 'expense', 'income', 'transfer'
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
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
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  month INT NOT NULL,               -- 1-12
  year INT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Política: usuário só acessa seus próprios dados
CREATE POLICY "Users own data" ON accounts
  FOR ALL USING (auth.uid() = user_id);
-- (repetir para todas as tabelas)
```

---

## Arquitetura de Rotas

```
/                     → Redireciona para /dashboard ou /login
/login                → Página de autenticação
/register             → Cadastro
/dashboard            → Página inicial (Início)
/transactions         → Lista de transações com filtros
/transactions/new     → Adicionar transação
/goals                → Sonhos/Objetivos
/budget               → Orçamento
/analysis             → Análise (gráficos e relatórios)
/settings             → Configurações da conta
/settings/accounts    → Gerenciar contas bancárias
/settings/categories  → Gerenciar categorias
/settings/profile     → Perfil do usuário
```

---

## Páginas e Componentes

### 1. Layout Principal

- **Navbar superior** com logo, links de navegação (Início, Transações, Sonhos, Orçamento, Análise, Configurações), e avatar/email do usuário no canto direito
- **Sidebar esquerda** (colapsável no mobile) com:
  - Lista de **Contas** com saldos individuais e saldo total
  - Botões "Limpar" e "Nova conta"
  - **Busca rápida** por texto
  - **Categorias** em lista com checkboxes para filtrar
- **Conteúdo principal** ocupa o restante da tela
- Header verde escuro (`#2d5a27` ou similar), fundo do conteúdo cinza muito claro

### 2. Dashboard (Início)

**Seção: Entradas e Saídas do mês**
- Seletor de mês/ano com setas de navegação (← Fevereiro/2026 →)
- Checkbox "Incluir saldo anterior"
- Linha: Saldo anterior + valor
- Linha: Entradas + valor (verde)
- Linha: Saídas + valor (vermelho)
- Total em destaque grande

**Seção: Despesas por Categoria**
- Gráfico de pizza (Recharts `PieChart`) com cores distintas
- Dropdown para filtrar por categoria
- Legenda abaixo do gráfico

**Seção: Saldo das Contas** 
- Gráfico de linha (Recharts `LineChart`) mostrando evolução do saldo no mês
- Uma linha por conta ativa, com cores diferenciadas

**Seção: Anteriores não consolidadas**
- Tabela: Descrição | Data | Valor
- Transações passadas ainda não confirmadas como efetivadas
- Ícones de editar em cada linha

**Seção: Próximas não consolidadas**
- Mesma estrutura, para transações futuras agendadas

**Seção: Próximas com alerta**
- Transações próximas que merecem atenção (contas a pagar)

**Seção: Últimas alterações**
- Log das últimas modificações feitas

### 3. Transações

**Filtros no topo:**
- Seletor de mês/ano
- Dropdown "Todas as transações" / "Despesas" / "Receitas" / "Transferências"
- Ícone de filtro avançado e ícone de atualizar

**Barra de ações:**
- Botão "+ Adicionar transação"
- Botões: Excluir (X), Confirmar (✓), Confirmar todas (✓✓)
- Dropdown "Alterar categoria"
- Botão "Exportar"

**Formulário inline de nova transação** (aparece ao clicar em "+ Adicionar transação"):
- Radio buttons: Despesa | Receita | Transferência
- Campo de data (date picker)
- Campo de descrição
- Dropdown de categoria
- Dropdown de conta
- Campo de valor
- Botão "Mais opções" (expande para: parcelas, recorrência, observações, anexo)
- Botão de confirmar (✓) verde

**Lista de transações** agrupada por data:
- Header de grupo: data por extenso (ex: "03/02/2015, Terça-feira")
- Cada linha: checkbox | descrição | ícone de categoria | nome da categoria | ícones de recorrência/parcela | conta | valor colorido (+ verde / - vermelho) | ícone de confirmação
- Rodapé de grupo: "Saldo do dia: R$ XX.XXX,XX"
- Linha especial "Todos" no topo com saldo do período

### 4. Sonhos (Goals)

- Grid de cards com imagem, título, barra de progresso, valor atual vs meta, data alvo
- Botão "+ Novo sonho"
- Modal para criar/editar sonho com upload de imagem para Supabase Storage
- Possibilidade de adicionar aportes

### 5. Orçamento

- Seletor de mês
- Tabela por categoria: categoria | orçado | gasto | saldo | barra de progresso colorida
- Verde se dentro do orçamento, amarelo se próximo do limite, vermelho se estourou
- Botão para definir/editar orçamento de cada categoria

### 6. Análise

- Gráficos de barras: receitas vs despesas por mês (últimos 12 meses)
- Gráfico de pizza: despesas por categoria
- Tabela de maiores despesas
- Filtros por período, conta, categoria

### 7. Configurações

- **Contas**: CRUD completo com nome, tipo, saldo inicial, cor, ícone
- **Categorias**: Árvore hierárquica com subcategorias, CRUD
- **Perfil**: Nome, email, foto (upload para Storage), trocar senha
- **Importação/Exportação**: CSV/OFX

---

## Componentes Reutilizáveis

```
components/
  layout/
    Navbar.tsx
    Sidebar.tsx
    AccountsList.tsx
    CategoryFilter.tsx
  
  transactions/
    TransactionForm.tsx       -- formulário inline + modal
    TransactionRow.tsx
    TransactionGroup.tsx      -- grupo por data
    TransactionFilters.tsx
  
  dashboard/
    SummaryCard.tsx           -- card Entradas/Saídas
    ExpensesPieChart.tsx
    BalanceLineChart.tsx
    UpcomingTransactions.tsx
  
  ui/
    MonthNavigator.tsx        -- seletor de mês com setas
    CurrencyInput.tsx         -- input formatado em R$
    CategorySelect.tsx        -- select com ícones
    AccountSelect.tsx
    ConfirmDialog.tsx
    EmptyState.tsx
```

---

## Funcionalidades Obrigatórias

1. **Autenticação completa**: login, registro, recuperação de senha, logout
2. **CRUD de contas bancárias** com saldo e tipo
3. **CRUD de categorias** com hierarquia (pai/filho) e cores
4. **CRUD de transações**: despesas, receitas, transferências entre contas
5. **Transações parceladas**: campo "X/Y parcelas", gerar todas automaticamente
6. **Transações recorrentes**: mensal, semanal, etc. — gerar próximas automaticamente
7. **Consolidação**: marcar transação como efetivada (altera saldo real da conta)
8. **Saldo calculado dinamicamente** com base nas transações consolidadas
9. **Navegação por mês** em todas as telas
10. **Filtros** por tipo, conta, categoria, período
11. **Dashboard** com resumo do mês e gráficos
12. **Sonhos** com progresso visual
13. **Orçamento** por categoria com alertas de estouro
14. **Exportação CSV** das transações filtradas
15. **Responsividade total** (mobile-first, sidebar colapsável)

---

## Funcionalidades Extras (Diferencial)

- **Modo escuro** com toggle
- **Notificações** de transações vencidas
- **Busca global** por descrição em tempo real
- **Atalhos de teclado** (N = nova transação, etc.)
- **Animações suaves** em transições de página e abertura de modais
- **PWA**: adicionar ao homescreen, funcionar offline (cache de leitura)

---

## Design System

```css
/* Cores principais */
--color-primary: #3a7d2c;        /* Verde escuro - menus, botões primários */
--color-primary-dark: #2d5a27;   /* Verde mais escuro - hover, navbar */
--color-primary-light: #e8f5e2;  /* Verde claro - backgrounds de seleção */
--color-income: #2e7d32;         /* Verde receita */
--color-expense: #c62828;        /* Vermelho despesa */
--color-warning: #f57c00;        /* Laranja alerta */
--color-bg: #f5f5f5;             /* Fundo geral */
--color-surface: #ffffff;        /* Cards e painéis */
--color-border: #e0e0e0;         /* Bordas sutis */
--color-text: #212121;           /* Texto principal */
--color-text-secondary: #757575; /* Texto secundário */

/* Tipografia */
font-family: 'DM Sans', 'Nunito', sans-serif;  /* corpo */
font-family: 'DM Serif Display', serif;         /* títulos grandes */

/* Sombras */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
--shadow-md: 0 4px 12px rgba(0,0,0,0.10);

/* Border radius */
--radius: 8px;
--radius-lg: 12px;
```

---

## Estrutura de Pastas do Projeto

```
src/
  app/                    -- páginas (React Router ou Next.js App Router)
  components/             -- componentes reutilizáveis
  hooks/                  -- custom hooks (useTransactions, useAccounts, etc.)
  lib/
    supabase.ts           -- cliente Supabase
    utils.ts              -- formatCurrency, formatDate, etc.
    validations.ts        -- schemas Zod
  store/                  -- Zustand stores
  types/                  -- TypeScript interfaces
  styles/                 -- globals e variáveis CSS
```

---

## Configuração Supabase

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Variáveis de ambiente (.env):**
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Variáveis no Vercel:** adicionar as mesmas no painel do projeto em Settings → Environment Variables.

---

## Deploy na Vercel

1. Push do projeto para GitHub
2. Importar repositório no Vercel
3. Framework Preset: **Vite** (ou Next.js se usar)
4. Adicionar variáveis de ambiente
5. Deploy automático a cada push na branch `main`

**vercel.json** (se necessário para SPA):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## Observações Finais

- Usar `pt-BR` em todos os formatos de data e moeda (`Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'})`)
- Saldo das contas deve ser **recalculado** sempre que transações forem adicionadas/editadas/removidas
- Transações não consolidadas **não alteram o saldo real**, apenas são projetadas
- Ao criar transações parceladas, gerar automaticamente todas as parcelas no banco
- Implementar **optimistic updates** para UX mais fluida (atualizar UI antes da resposta do Supabase)
- Acessibilidade: labels em todos os inputs, contraste adequado, navegação por teclado
