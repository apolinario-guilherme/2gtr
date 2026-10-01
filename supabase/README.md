# 2gtr — Backend com nuvem (Supabase)

Fase 1 (neste commit): fundação nuvem **sem tocar no app**.
Fase 2 (após provisionar): Auth + motor de sincronismo no app.

## Por que Supabase e não Firebase

O 2gtr é relacional (casal/membros, splits, faturas, vínculos) e a
autorização é "membros do casal veem tudo do casal". Isso mapeia direto
para Postgres + RLS. Firebase/Firestore exigiria remodelar para NoSQL e
replicar as regras em security rules — mais risco, mesmo resultado.

## O que a Fase 1 entrega

- `supabase/schema.sql`: ~90 tabelas fiéis ao adapter local, IDs legados
  preservados como TEXT PK (migração sem remapeamento), RLS por casal,
  índices das queries quentes.
- Nenhuma mudança em `js/` (princípio da auditoria: sem código morto).
- `supabase/.env.example`: variáveis que a Fase 2 vai usar.

## Setup (você faz no console, ~20 min, plano gratuito)

1. Criar projeto em supabase.com (região próxima, ex. São Paulo).
2. SQL Editor → colar `schema.sql` → Run (confira "Success, no rows returned"
   + tabelas em Table Editor).
3. Authentication → Providers: ativar **Email**, **Google**, **Facebook**,
   **Apple** (cada console gera seu Client ID/Secret — Supabase guarda os
   secrets, nunca o frontend).
4. Authentication → URL Configuration: Site URL = domínio final;
   Redirect URLs = `https://<dominio>/#/auth/callback` (+ localhost p/ dev).
5. Storage: criar bucket privado `attachments` (avatares/mídias na Fase 2).
6. Project Settings → API: copiar `SUPABASE_URL` + `anon public key` para
   `supabase/.env` local (não commitar).

## Fase 2 (próximo passo, com o projeto pronto)

1. `js/cloud.js`: cliente Supabase + sessão (troca `juntos_session_v1`).
2. Login social volta via Supabase Auth (Google/FB/Apple nativos, com
   secrets no servidor — resolvendo a limitação que derrubou a v1
   frontend-only). E-mail/senha continua via Supabase Auth.
3. Migração de dados: exportar `juntos_db_v1` → script importa por casal
   (usuários: criar no Auth e linkar via `profiles`; **senhas locais NÃO
   migram** — cada usuário redefine via "Esqueci a senha" do Supabase).
4. Sincronismo: local-first + fila por `updated_at`/`idempotency_key`
   (já existem nas tabelas críticas) + Realtime nos canais do casal.
5. RLS já pronta; revisar `invitations/resets` (fluxo passa ao servidor).

## Custos e limites honestos

- Plano gratuito cobre uso pessoal/familiar folgado; realtime e Auth têm
  cotas — monitorar em Reports.
- Sem backend próprio: regras pesadas (jobs, webhooks WhatsApp/Meta)
  usam Edge Functions (Fase 3) ou ficam no cliente como hoje.
- Offline-first se mantém: localStorage continua como cache; nuvem é
  a fonte de verdade entre aparelhos.
