# Modelo A: implantacao real do BolaoCopa 2026

Este guia transforma o prototipo atual em uma plataforma de producao com Supabase, Mercado Pago, API-Football e Resend.

## 1. Stack escolhida

- Frontend: Vercel + React/Vite/Tailwind.
- Banco: Supabase Postgres.
- Backend: Supabase Edge Functions.
- Pagamentos: Mercado Pago Checkout API com PIX e cartao.
- Resultados: API-Football, league `1`, season `2026`.
- E-mails: Resend.

## 2. Criar Supabase

1. Acesse `https://supabase.com`.
2. Crie um novo projeto.
3. Abra o SQL Editor.
4. Rode `supabase/migrations/0001_modelo_a_schema.sql`.
5. Copie `Project URL`, `anon key` e `service_role key`.

## 3. Configurar variaveis

Crie as variaveis abaixo no ambiente de deploy e como secrets no Supabase:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_YOUR_ACCESS_TOKEN
MERCADO_PAGO_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
API_FOOTBALL_KEY=YOUR_API_FOOTBALL_KEY
RESEND_API_KEY=YOUR_RESEND_API_KEY
PUBLIC_APP_URL=https://seu-dominio.com.br
```

## 4. Deploy das Edge Functions

Com Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set --env-file .env
supabase functions deploy create-payment --no-verify-jwt
supabase functions deploy mercadopago-webhook --no-verify-jwt
supabase functions deploy sync-results --no-verify-jwt
```

URLs finais:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-payment
https://YOUR_PROJECT_REF.supabase.co/functions/v1/mercadopago-webhook
https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-results
```

## 5. Mercado Pago

1. Acesse o painel de desenvolvedor do Mercado Pago.
2. Crie uma aplicacao.
3. Copie o Access Token de sandbox para testes.
4. Configure webhook apontando para:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/mercadopago-webhook
```

5. Eventos recomendados: `payment`, `merchant_order`.
6. Teste PIX com conta de teste.

## 6. API-Football

1. Crie conta em `api-football.com`.
2. Copie a API key.
3. Use o endpoint de fixtures da Copa: `GET /fixtures?league=1&season=2026`.
4. Agende a function `sync-results` para rodar a cada 5 minutos durante jogos.

## 7. Vercel

1. Conecte o repositorio no Vercel.
2. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Deploy.
4. Aponte o dominio para a Vercel.
5. Ative HTTPS automatico.

## 8. Teste completo

1. Criar usuario organizador.
2. Criar bolao.
3. Abrir link publico.
4. Comprar cota em sandbox.
5. Confirmar que webhook atualizou `pool_shares.payment_status = paid`.
6. Salvar palpites.
7. Rodar `sync-results`.
8. Confirmar que `rankings` foi recalculado.

## 9. Observacoes importantes

- Nao coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Webhooks devem usar secrets e logs auditaveis antes de producao.
- Para split real e custodia juridica, valide com contador/advogado e com o modelo do Mercado Pago apropriado para marketplace/subcontas.
- Bolao privado entre conhecidos e baseado em habilidade reduz risco juridico, mas bolao publico de alto valor exige parecer juridico.

## 10. Proximo desenvolvimento

Depois da implantacao tecnica, o proximo passo e trocar o `localStorage` do frontend pelo client Supabase:

- `getBoloes` -> `supabase.from('pools').select(...)`
- `saveBolao` -> `supabase.from('pools').insert(...)`
- `saveCota` -> `supabase.from('pool_shares').insert(...)`
- Checkout -> chamar `create-payment`
- Ranking -> ler `rankings` com join em `pool_shares`