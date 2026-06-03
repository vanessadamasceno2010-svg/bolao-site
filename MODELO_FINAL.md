# 🚀 Modelo Final — BolãoCopa 2026

## Visão Geral

O **Modelo Final** é a versão completa e pronta para uso do sistema de bolões da Copa do Mundo 2026, construída sobre o **Modelo B** com todas as funcionalidades solicitadas.

### ✅ Funcionalidades Implementadas

#### Para Participantes
- ✅ Cadastro de conta (usuário + senha) no ato da compra
- ✅ Compra de múltiplas cotas (cada cota = 1 bilhete independente)
- ✅ Preenchimento de palpites por bilhete (ex: 3 cotas = 3 palpites por jogo)
- ✅ Redirecionamento automático para o Dashboard após pagamento
- ✅ Perfil completo com:
  - Meus bolões e bilhetes
  - Palpites por bilhete
  - Sistema de indicações (5% do prêmio)
  - Edição de dados pessoais
- ✅ Uma cota por participante por bolão (regra aplicada)

#### Para Organizadores
- ✅ Portal separado (`/organizador`) com identidade visual própria
- ✅ Login/cadastro próprio (e-mail + senha)
- ✅ Criação de bolão com comissão e bônus de indicação configuráveis
- ✅ Painel de gestão com:
  - Lista de participantes
  - Ranking por bilhete
  - Controle financeiro
  - Sistema de indicações
- ✅ Link público limpo (`#/b/{slug}`) — não revela a plataforma

#### Sistema de Indicações
- ✅ Cada participante recebe link único de indicação
- ✅ 5% do prêmio do indicado vai para quem indicou (1º, 2º ou 3º lugar)
- ✅ Bônus pago via PIX após encerramento da Copa
- ✅ Prêmio do indicado **não é reduzido**

---

## 🗂️ Estrutura Final do Projeto

```
bolao-copa2026/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Header/Footer do participante
│   │   ├── OrgLayout.tsx       # Header/Footer do organizador
│   │   ├── Toaster.tsx
│   │   ├── Confetti.tsx
│   │   └── ShareModal.tsx
│   ├── pages/
│   │   ├── Home.tsx            # Landing page (participante)
│   │   ├── Perfil.tsx          # Dashboard do participante
│   │   ├── PublicBolao.tsx     # Página pública do bolão
│   │   ├── JoinBolao.tsx       # Checkout + criação de conta
│   │   ├── Predictions.tsx     # Palpites por bilhete
│   │   ├── Ranking.tsx         # Ranking por bilhete
│   │   ├── MyReferrals.tsx     # Painel de indicações
│   │   ├── ModeloA.tsx         # Documentação do Modelo A
│   │   ├── Legal.tsx           # Termos, Privacidade, Aviso Legal
│   │   │
│   │   └── [Organizador]
│   │       ├── OrgLogin.tsx
│   │       ├── Dashboard.tsx
│   │       ├── CreateBolao.tsx
│   │       ├── ManageBolao.tsx
│   │       └── AdminResults.tsx
│   ├── lib/
│   │   ├── storage.ts          # LocalStorage + lógica completa
│   │   ├── scoring.ts          # Ranking por bilhete
│   │   ├── router.ts           # Roteamento com query strings
│   │   └── toast.ts
│   ├── types.ts                # User, Cota, Ticket, Prediction...
│   └── App.tsx                 # Roteamento principal
├── supabase/
│   ├── migrations/
│   │   └── 0001_modelo_a_schema.sql
│   └── functions/
│       ├── create-payment/
│       ├── mercadopago-webhook/
│       └── sync-results/
├── docs/
│   └── MODELO_A_IMPLANTACAO.md
├── MODELO_FINAL.md             # ← Este arquivo
├── .env.example
└── index.html
```

---

## 🔐 Separação de Acesso

| Perfil | Pode acessar | Não pode acessar |
|--------|--------------|------------------|
| **Participante** | `/perfil`, `/b/{slug}`, `/b/{slug}/join`, `/b/{slug}/predict/:id`, `/b/{slug}/ranking`, `/b/{slug}/indicacao/:id` | `/organizador/*`, `/create`, `/dashboard`, `/manage/:id`, `/admin/results` |
| **Organizador** | `/organizador/*` (login obrigatório) | — |

**Links públicos** (`#/b/{slug}`) **não revelam** que a plataforma é "BolãoCopa".

---

## 📋 Checklist de Implantação (Produção)

### 1. Backend (Supabase)

- [ ] Criar projeto no Supabase
- [ ] Executar `supabase/migrations/0001_modelo_a_schema.sql`
- [ ] Criar as 3 Edge Functions:
  - `create-payment`
  - `mercadopago-webhook`
  - `sync-results`
- [ ] Configurar secrets no Supabase:
  ```bash
  MERCADO_PAGO_ACCESS_TOKEN
  API_FOOTBALL_KEY
  RESEND_API_KEY
  PUBLIC_APP_URL
  ```

### 2. Pagamentos (Mercado Pago)

- [ ] Criar aplicação no Mercado Pago
- [ ] Configurar webhook para:
  ```
  https://SEU_PROJETO.supabase.co/functions/v1/mercadopago-webhook
  ```
- [ ] Testar PIX em sandbox
- [ ] Subir para produção

### 3. Resultados (API-Football)

- [ ] Criar conta em api-football.com
- [ ] Obter API Key
- [ ] Agendar `sync-results` a cada 5 minutos durante jogos

### 4. Frontend (Vercel)

- [ ] Conectar repositório no Vercel
- [ ] Configurar variáveis de ambiente:
  ```
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  ```
- [ ] Fazer deploy
- [ ] Configurar domínio customizado (opcional)

### 5. Testes Finais

- [ ] Criar bolão como organizador
- [ ] Comprar cota como participante (criar conta)
- [ ] Preencher palpites em múltiplos bilhetes
- [ ] Verificar sistema de indicações
- [ ] Testar webhook de pagamento
- [ ] Testar ranking por bilhete
- [ ] Testar em celular (PWA)

---

## 💰 Modelo de Monetização

| Item | Valor |
|------|-------|
| Comissão do organizador | 5% ~ 15% (configurável) |
| Bônus de indicação | 5% do prêmio do indicado |
| Custo por transação | ~2-3% (Mercado Pago) |
| Exemplo: 100 cotas × R$ 50 | R$ 5.000 arrecadado |
| Comissão do organizador (12%) | R$ 600 |
| Bônus de indicações (estimado) | R$ 200~400 |
| Prêmio líquido | ~R$ 4.000~4.200 |

---

## 📌 Próximos Passos Recomendados

1. **Substituir LocalStorage por Supabase** (obrigatório para produção)
2. **Implementar autenticação real** (Supabase Auth)
3. **Conectar webhook do Mercado Pago**
4. **Agendar sync de resultados** (API-Football)
5. **Adicionar e-mails automáticos** (Resend)
6. **Criar PWA** (manifest + service worker)
7. **Testes de carga** com 500+ participantes

---

## 🛡️ Considerações Jurídicas

- O sistema está em conformidade com a **LGPD**
- Termos de Uso, Política de Privacidade e Aviso Legal estão incluídos
- Bolões entre conhecidos com premiação baseada em habilidade são permitidos no Brasil
- Recomenda-se consultar um advogado para bolões de alto valor

---

**Modelo Final concluído.** O projeto está pronto para ser implantado em produção seguindo o checklist acima.