# 🏆 BolãoCopa 2026 - Plataforma Completa

Sistema completo de bolões para a Copa do Mundo 2026 com suporte a múltiplas cotas por participante, sistema de indicações com bônus de 5%, e painel administrativo separado.

## ✨ Funcionalidades

### 👥 Para Participantes
- ✅ Cadastro e login com usuário/senha
- ✅ Compra de múltiplas cotas (1-10 por bolão)
- ✅ Preenchimento de palpites por bilhete
- ✅ Dashboard pessoal com estatísticas
- ✅ Sistema de indicações (5% de bônus do prêmio)
- ✅ Recuperação de senha por e-mail

### 📊 Para Organizadores
- ✅ Portal administrativo separado (`/organizador`)
- ✅ Criação ilimitada de bolões
- ✅ Configuração flexível (comissão, prêmios, prazo)
- ✅ Dashboard com métricas em tempo real
- ✅ Gestão de participantes e pagamentos
- ✅ Gerenciamento de resultados

### 🔗 Sistema de Indicações
- ✅ Links únicos de indicação por participante
- ✅ 5% de bônus sobre prêmios de indicados (1º, 2º e 3º lugar)
- ✅ Rastreamento completo de conversões
- ✅ Links limpos sem revelar a plataforma (`#/b/{slug}`)

## 🚀 Deploy Rápido

### Opção 1: Vercel (Recomendado)
```bash
npm install -g vercel
vercel --prod
```

### Opção 2: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Opção 3: GitHub Pages
```bash
# Adicione ao repositório GitHub e ative Pages em Settings
# Configure para branch principal, pasta /dist
```

### Opção 4: Docker
```bash
docker build -t bolaocopa2026 .
docker run -p 8080:80 bolaocopa2026
```

### Opção 5: Hospedagem Tradicional
1. Execute `npm run build`
2. Envie o conteúdo da pasta `dist/` para seu servidor
3. Configure URL amigáveis (ver `.htaccess` ou `nginx.conf`)

## 📦 Arquivo Único

O build gera **um único arquivo** (`dist/index.html`) com todo o código inline:
- ✅ 452KB total (118KB gzipped)
- ✅ Zero dependências externas
- ✅ Funciona offline após primeiro carregamento
- ✅ Compatível com qualquer hospedagem

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📁 Estrutura do Projeto

```
bolao-copa-2026/
├── dist/                    # Build de produção (arquivo único)
│   └── index.html          # Aplicação completa (452KB)
├── src/                     # Código fonte
│   ├── components/         # Componentes React
│   ├── pages/              # Páginas da aplicação
│   ├── lib/                # Utilitários e lógica
│   └── data/               # Dados dos jogos
├── public/                  # Assets públicos
├── supabase/               # Schema e migrations
├── docs/                   # Documentação
├── MODELO_FINAL.md         # Documentação completa
└── DEPLOY.md               # Guia detalhado de deploy
```

## 🎮 Demo

- **Home**: Acesse a raiz
- **Perfil Participante**: `/perfil` (login: `pedro` / `123456`)
- **Portal Organizador**: `/organizador` (crie uma conta)
- **Bolão Demo**: `/b/copa-2026-demo`

## 📄 Licença

MIT License - Livre para uso comercial e pessoal

## 🤝 Suporte

Para dúvidas ou problemas, consulte:
- `DEPLOY.md` - Guia completo de deploy
- `MODELO_FINAL.md` - Documentação técnica
- `GUIA_RAPIDO.md` - Guia rápido de uso

---

**Versão**: 1.0.0 (Modelo Final)  
**Status**: ✅ Pronto para Produção
