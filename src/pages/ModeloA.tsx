import { Badge, Button, Card } from '../components/Layout';
import { navigate } from '../lib/router';

const stack = [
  ['Frontend', 'Vercel + React/Vite', 'Interface publica, dashboard e checkout'],
  ['Banco', 'Supabase Postgres', 'Boloes, cotas, palpites, pagamentos e ranking'],
  ['Backend', 'Supabase Edge Functions', 'APIs serverless, webhooks e automacoes'],
  ['Pagamentos', 'PushinPay (PIX)', 'QR Code real, webhook, confirmacao automatica'],
  ['Resultados', 'API-Football (gratuito)', 'Placares oficiais via Supabase Edge Function'],
  ['Notificacoes', 'Resend', 'E-mail transacional para participantes e organizadores'],
] as const;

const phases = [
  ['1', 'Criar projeto Supabase', 'Rodar a migration SQL e habilitar RLS nas tabelas.'],
  ['2', 'Configurar PushinPay', 'Obter token, configurar webhook. Token fica no Supabase Secrets.'],
  ['3', 'Deploy Edge Functions', 'Publicar create-payment, mercadopago-webhook e sync-results.'],
  ['4', 'Conectar frontend', 'Definir VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no deploy.'],
  ['5', 'Automacoes', 'Agendar sync-results a cada 5 minutos durante jogos.'],
  ['6', 'Validacao final', 'Testar criar bolao, comprar cota, confirmar webhook e ranking.'],
] as const;

const envs = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MERCADO_PAGO_ACCESS_TOKEN',
  'MERCADO_PAGO_WEBHOOK_SECRET',
  'API_FOOTBALL_KEY',
  'RESEND_API_KEY',
  'PUBLIC_APP_URL',
] as const;

export function ModeloA() {
  return (
    <div className="max-w-5xl mx-auto animate-fadeInUp">
      <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm mb-3">
        ← Inicio
      </button>

      <section className="mb-8">
        <Badge color="emerald">Modelo A · Producao real</Badge>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-3">
          Implantacao profissional do BolaoCopa 2026
        </h1>
        <p className="text-slate-400 mt-4 max-w-3xl text-lg leading-relaxed">
          Este modelo transforma o prototipo em uma plataforma monetizavel com banco real,
          pagamentos PIX/cartao, webhooks, ranking automatico, notificacoes e deploy escalavel.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={() => navigate('/organizador/create')}>Criar bolão</Button>
          <Button variant="secondary" onClick={() => navigate('/organizador/dashboard')}>Ver painel</Button>
          <Button variant="secondary" onClick={() => navigate('/legal')}>Ver aviso legal</Button>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stack.map(([title, tech, desc]) => (
          <Card key={title} className="p-5" hover>
            <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-2">{title}</div>
            <h3 className="font-black text-lg">{tech}</h3>
            <p className="text-sm text-slate-400 mt-2">{desc}</p>
          </Card>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-5 mb-10">
        <Card className="p-6">
          <h2 className="text-xl font-black mb-4">Arquitetura do Modelo A</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <Flow from="Participante" to="Frontend Vercel" desc="Acessa link do bolao e inicia checkout." />
            <Flow from="Frontend" to="create-payment" desc="Chama Edge Function (token seguro no backend)." />
            <Flow from="Supabase" to="PushinPay" desc="Gera PIX real com QR Code e copia-e-cola." />
            <Flow from="API-Football" to="sync-results" desc="Atualiza placares oficiais periodicamente." />
            <Flow from="Supabase" to="Ranking" desc="Recalcula pontos e classificacao por bolao." />
            <Flow from="Resend" to="Usuario" desc="Envia recibos, alertas e resultado final." />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-500/[0.08] to-yellow-500/[0.04] border-emerald-500/20">
          <h2 className="text-xl font-black mb-4">Arquivos criados para producao</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><strong className="text-emerald-300">supabase/migrations/0001_modelo_a_schema.sql</strong><br />Banco completo + RLS + indices.</li>
            <li><strong className="text-emerald-300">supabase/functions/create-payment</strong><br />Cria PIX real via PushinPay (token no backend).</li>
            <li><strong className="text-emerald-300">supabase/functions/mercadopago-webhook</strong><br />Confirma pagamento automaticamente.</li>
            <li><strong className="text-emerald-300">supabase/functions/sync-results</strong><br />Importa placares da API-Football.</li>
            <li><strong className="text-emerald-300">docs/MODELO_A_IMPLANTACAO.md</strong><br />Passo a passo de deploy.</li>
          </ul>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-black mb-4">Checklist de implantacao</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phases.map(([n, title, desc]) => (
            <Card key={n} className="p-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 flex items-center justify-center font-black mb-3">
                {n}
              </div>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-slate-400 mt-1">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-5 mb-10">
        <Card className="p-6">
          <h2 className="text-xl font-black mb-4">Variaveis de ambiente</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {envs.map(e => (
              <code key={e} className="bg-slate-950/60 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-emerald-300">
                {e}
              </code>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black mb-4">Custos estimados</h2>
          <Cost label="Vercel" value="R$ 0-100/mes" />
          <Cost label="Supabase" value="R$ 0-130/mes" />
          <Cost label="API-Football" value="R$ 0-150/mes" />
          <Cost label="Resend" value="R$ 0-50/mes" />
          <Cost label="PushinPay" value="taxa por transacao PIX" />
          <p className="text-xs text-slate-500 mt-4">
            Para validar o negocio, comece no gratuito. Suba de plano apenas quando houver volume real.
          </p>
        </Card>
      </section>

      <Card className="p-6 border-yellow-500/20 bg-yellow-500/[0.05]">
        <h2 className="text-xl font-black mb-2">Proximo passo recomendado</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Abra o arquivo <strong>docs/MODELO_A_IMPLANTACAO.md</strong> e siga a ordem:
          Supabase → PushinPay → Edge Functions → Vercel → teste de pagamento real.
          Quando quiser, posso continuar com a conexao do frontend atual ao Supabase real.
        </p>
      </Card>
    </div>
  );
}

function Flow({ from, to, desc }: { from: string; to: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start border-b border-white/[0.04] pb-3 last:border-0">
      <div className="text-xs text-slate-500 w-24 shrink-0">{from}</div>
      <div className="text-emerald-400">→</div>
      <div>
        <div className="font-bold text-white text-sm">{to}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

function Cost({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-white/[0.04] text-sm">
      <span className="text-slate-400">{label}</span>
      <strong className="text-slate-200">{value}</strong>
    </div>
  );
}