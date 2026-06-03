# 🚀 Guia Completo de Deploy - BolãoCopa 2026

Este guia cobre todas as opções de deploy para colocar o BolãoCopa 2026 no ar.

## 📦 Pré-requisitos

1. **Node.js 18+** instalado
2. **npm** ou **yarn** instalado
3. Código fonte do projeto
4. Conta em uma plataforma de hospedagem (opcional)

## 🔨 Build para Produção

Antes de qualquer deploy, você precisa gerar o build:

```bash
# Instalar dependências
npm install

# Gerar build de produção
npm run build
```

O build gera um **único arquivo** em `dist/index.html` (452KB, 118KB gzipped) com todo o código inline.

---

## 🌐 Opções de Deploy

### 1️⃣ Vercel (Recomendado - Gratuito)

**Vantagens:** Deploy automático, SSL grátis, CDN global, preview de PRs

#### Deploy via CLI:
```bash
npm install -g vercel
vercel --prod
```

#### Deploy via Dashboard:
1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório do GitHub
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Clique em "Deploy"

#### Arquivo de configuração já incluído:
- `vercel.json` - Configurado para SPA routing

---

### 2️⃣ Netlify (Gratuito)

**Vantagens:** Deploy automático, formulários, funções serverless, split testing

#### Deploy via CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Deploy via Dashboard:
1. Acesse [netlify.com](https://netlify.com)
2. Importe o repositório do GitHub
3. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Clique em "Deploy"

#### Arquivo de configuração já incluído:
- `netlify.toml` - Configurado para SPA routing e headers de segurança

---

### 3️⃣ GitHub Pages (Gratuito)

**Vantagens:** Totalmente grátis, integração com GitHub, sem limites de banda

#### Configuração:
1. Crie um repositório no GitHub
2. Adicione o código fonte
3. Vá em **Settings** → **Pages**
4. Configure:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (ou `master`)
   - **Folder**: `/ (root)` ou `/dist`
5. Salve e aguarde o deploy

#### Arquivo de configuração já incluído:
- `public/404.html` - Para SPA routing no GitHub Pages

**⚠️ Importante:** Se usar `/dist` como folder, certifique-se de fazer commit da pasta `dist/` ou usar GitHub Actions para build automático.

---

### 4️⃣ Cloudflare Pages (Gratuito)

**Vantagens:** CDN global, build automático, unlimited bandwidth

#### Deploy:
1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecte seu repositório GitHub
3. Configure:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Deploy!

---

### 5️⃣ Docker (Self-hosted)

**Vantagens:** Controle total, portabilidade, escalabilidade

#### Build e execução:
```bash
# Build da imagem
docker build -t bolaocopa2026 .

# Executar container
docker run -d -p 8080:80 --name bolaocopa bolaocopa2026
```

#### Docker Compose:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

#### Arquivo de configuração já incluído:
- `Dockerfile` - Multi-stage build com nginx
- `nginx.conf` - Configuração otimizada

---

### 6️⃣ Apache (Hospedagem Tradicional)

**Vantagens:** Amplamente suportado, configuração familiar

#### Deploy:
1. Execute `npm run build`
2. Envie o conteúdo da pasta `dist/` para seu servidor (via FTP/SFTP)
3. Certifique-se de que o `.htaccess` está na raiz

#### Arquivo de configuração já incluído:
- `public/.htaccess` - Configurado para SPA routing, GZIP e cache

---

### 7️⃣ Nginx (Hospedagem Tradicional)

**Vantagens:** Alta performance, configuração flexível

#### Deploy:
1. Execute `npm run build`
2. Envie o conteúdo da pasta `dist/` para `/var/www/html`
3. Configure o nginx usando o arquivo fornecido

#### Arquivo de configuração já incluído:
- `nginx.conf` - Configurado para SPA routing, SSL, GZIP e cache

#### Instalação:
```bash
sudo cp nginx.conf /etc/nginx/conf.d/bolaocopa.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

### 8️⃣ AWS S3 + CloudFront

**Vantagens:** Altamente escalável, CDN global, pay-as-you-go

#### Deploy via CLI:
```bash
# Criar bucket S3
aws s3 mb s3://bolaocopa2026

# Fazer upload do build
aws s3 sync dist/ s3://bolaocopa2026 --acl public-read

# Configurar CloudFront (via console AWS)
```

---

### 9️⃣ Firebase Hosting (Gratuito até 10GB)

**Vantagens:** Integração com Firebase, SSL grátis, CDN global

#### Deploy:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Selecione "dist" como public directory
# Configure como SPA (yes)
firebase deploy
```

---

## 🔧 Configurações Adicionais

### Domínio Customizado

#### Vercel:
1. Vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure DNS:
   - **Tipo**: CNAME
   - **Nome**: `www` (ou `@` para raiz)
   - **Valor**: `cname.vercel-dns.com`

#### Netlify:
1. Vá em **Domain settings**
2. Adicione seu domínio
3. Configure DNS:
   - **Tipo**: A ou CNAME
   - **Nome**: `@` ou `www`
   - **Valor**: `75.2.60.5` ou `netlify.com`

### SSL/HTTPS

Todas as plataformas modernas (Vercel, Netlify, Cloudflare) configuram SSL automaticamente.

Para self-hosted (Docker/Apache/Nginx), use [Let's Encrypt](https://letsencrypt.org):

```bash
sudo certbot --nginx -d seu-dominio.com
```

### Variáveis de Ambiente

O projeto usa `localStorage` para dados (demo). Para produção com Supabase:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Configure nas configurações da plataforma de deploy.

---

## 📊 Verificação Pós-Deploy

Após o deploy, verifique:

1. ✅ Site carrega corretamente
2. ✅ Rotas funcionam (SPA routing)
3. ✅ SSL/HTTPS está ativo
4. ✅ Performance é boa (Lighthouse > 90)
5. ✅ SEO está configurado (meta tags, sitemap)
6. ✅ PWA funciona (manifest.json)

---

## 🐛 Troubleshooting

### Problema: Rotas não funcionam (404 ao recarregar)

**Solução:** Certifique-se de que o servidor está configurado para redirecionar todas as rotas para `index.html`:
- Vercel: `vercel.json` já configurado
- Netlify: `netlify.toml` já configurado
- Apache: `.htaccess` já configurado
- Nginx: `nginx.conf` já configurado

### Problema: Build falha

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: Assets não carregam

**Solução:** Verifique se os caminhos estão corretos e se o servidor está servindo arquivos estáticos.

---

## 📈 Monitoramento

Recomendações para monitorar em produção:

1. **Google Analytics** - Tracking de usuários
2. **Sentry** - Error tracking
3. **Uptime Robot** - Monitoramento de uptime
4. **Google Search Console** - SEO e indexação

---

## 🎯 Checklist Final

Antes de lançar:

- [ ] Build de produção gerado (`npm run build`)
- [ ] Testado em múltiplos navegadores
- [ ] Testado em dispositivos móveis
- [ ] SSL/HTTPS configurado
- [ ] Domínio customizado configurado
- [ ] Sitemap.xml atualizado
- [ ] robots.txt configurado
- [ ] Meta tags SEO otimizadas
- [ ] PWA manifest configurado
- [ ] Performance testada (Lighthouse)
- [ ] Backup de dados configurado (se aplicável)

---

## 📞 Suporte

Para dúvidas ou problemas:
- Documentação: `README.md` e `MODELO_FINAL.md`
- Issues: GitHub Issues do repositório
- Email: suporte@seu-dominio.com

---

**Boa sorte com o deploy! 🚀**
