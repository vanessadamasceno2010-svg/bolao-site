import type { ReactNode } from 'react';
import { Button, Card } from '../components/Layout';
import { navigate } from '../lib/router';
import { brl } from '../lib/scoring';

export function Home() {
  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="text-center pt-6 sm:pt-16 animate-fadeInUp">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 text-xs font-semibold mb-8 animate-pulse-glow">
          <span className="inline-flex gap-0.5">
            {['🇺🇸','🇲🇽','🇨🇦'].map(f => <span key={f}>{f}</span>)}
          </span>
          Copa do Mundo FIFA 2026
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9]">
          Crie o bolão da Copa
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-yellow-300 to-emerald-300 bg-clip-text text-transparent bg-[length:200%] animate-[shimmer_3s_linear_infinite]">
            entre seus amigos
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Pagamento via PIX automático, ranking em tempo real, prêmio distribuído sozinho
          — e <strong className="text-emerald-300">você ganha comissão</strong> em cada cota vendida.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button size="lg" onClick={() => navigate('/perfil')} className="min-w-[260px]">
            👤 Acessar Meu Perfil
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/b/copa-2026-demo')}>
            Ver Demo Funcionando
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/organizador')}>
            📊 Sou Organizador
          </Button>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex -space-x-2">
            {['🧑','👩','👨','🧑‍🦱','👩‍🦰','👨‍🦳'].map((e, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-sm">{e}</div>
            ))}
          </div>
          <span>Junte-se a <strong className="text-white">milhares</strong> de participantes</span>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <HeroStat n="48" label="Jogos da Copa" delay={0} />
          <HeroStat n="1-10" label="Cotas por bolão" delay={1} />
          <HeroStat n="5%" label="Bônus indicação" delay={2} />
          <HeroStat n="PIX" label="Pagamento instantâneo" delay={3} />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section>
        <SectionTitle title="Como funciona" sub="3 passos. Sem complicação." />
        <div className="grid md:grid-cols-3 gap-5">
          <Step n="1" icon="⚙️" title="Crie seu bolão" delay={0}>
            Defina valor da cota (R$ 20, 50, 100...), quantidade, regras de pontuação e
            distribuição do prêmio. Receba um link único.
          </Step>
          <Step n="2" icon="📲" title="Compartilhe no WhatsApp" delay={1}>
            Seus amigos acessam o link, pagam via PIX ou cartão e preenchem os
            palpites dos 48 jogos da Copa. Tudo pelo celular.
          </Step>
          <Step n="3" icon="🏆" title="Acompanhe e fature" delay={2}>
            Ranking atualiza em tempo real conforme os jogos rolam.
            Sua comissão é depositada automaticamente na sua chave PIX.
          </Step>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <SectionTitle title="Tudo automatizado" sub="Você não precisa fazer nada manualmente." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature icon="⚡" title="PIX em segundos" desc="QR Code gerado automaticamente. Confirmação instantânea via webhook." />
          <Feature icon="📊" title="Ranking automático" desc="Pontuação calculada em tempo real após cada jogo da Copa." />
          <Feature icon="💰" title="Split automático" desc="Comissão separada automaticamente. Prêmio em custódia segura." />
          <Feature icon="📲" title="Notificações" desc="E-mail e WhatsApp automáticos: confirmação, ranking, prazos." />
          <Feature icon="🔒" title="Seguro e transparente" desc="Pagamentos via gateway PCI-DSS. Dados protegidos pela LGPD." />
          <Feature icon="📈" title="Painel completo" desc="Dashboard financeiro, lista de participantes, exportar CSV." />
        </div>
      </section>

      {/* MONETIZAÇÃO */}
      <section>
        <Card className="p-8 sm:p-12 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-yellow-500/[0.06] border-emerald-500/20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-3">💰 Sua Receita</div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                Quanto você pode<br />ganhar com bolões?
              </h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                A cada cota vendida, uma porcentagem vai automaticamente para sua conta.
                Crie quantos bolões quiser — simultâneos, sem limite.
              </p>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <Check>Sem mensalidade — você só ganha quando vende cotas</Check>
                <Check>Repasse via PIX em até 1 dia útil</Check>
                <Check>Crie bolões ilimitados, simultâneos</Check>
                <Check>Painel financeiro com histórico completo</Check>
              </ul>
            </div>
            <div className="space-y-3">
              <RevCard shares={50} value={20} comm={12} />
              <RevCard shares={100} value={50} comm={12} highlight />
              <RevCard shares={200} value={100} comm={15} />
              <div className="text-center text-xs text-slate-500 mt-2">
                Imagine <strong className="text-emerald-300">10 bolões simultâneos</strong> → até <strong className="text-white">{brl(10 * 200 * 100 * 0.15)}</strong> de receita
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* REGRAS DE PONTUAÇÃO */}
      <section>
        <SectionTitle title="Sistema de pontuação" sub="Justo, automático e configurável pelo organizador." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <RuleCard pts="3" label="Placar exato" example="Previu 2×1, foi 2×1" color="emerald" icon="🎯" />
          <RuleCard pts="2" label="Empate correto" example="Previu empate, deu empate" color="blue" icon="🤝" />
          <RuleCard pts="1" label="Vencedor correto" example="Acertou quem ganhou" color="yellow" icon="✅" />
          <RuleCard pts="+2" label="Bônus diferença" example="Acertou o saldo de gols" color="purple" icon="➕" />
        </div>
      </section>

      {/* DISTRIBUIÇÃO */}
      <section>
        <SectionTitle title="Distribuição do prêmio" sub="Configurável pelo organizador. Padrão sugerido:" />
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <PrizeSlot medal="🥇" place="1º lugar" pct={50} color="from-yellow-400/20 to-yellow-600/5 border-yellow-400/30" />
          <PrizeSlot medal="🥈" place="2º lugar" pct={30} color="from-slate-300/15 to-slate-400/5 border-slate-400/25" />
          <PrizeSlot medal="🥉" place="3º lugar" pct={20} color="from-orange-400/15 to-orange-500/5 border-orange-400/25" />
        </div>
      </section>

      {/* SEGURANÇA */}
      <section>
        <Card className="p-8 sm:p-10">
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-2xl font-black mb-3">Segurança e conformidade</h3>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <Check>Pagamentos via PushinPay (PIX instantâneo)</Check>
                <Check>Criptografia TLS/SSL em todas as comunicações</Check>
                <Check>Conformidade com LGPD — seus dados protegidos</Check>
                <Check>Prêmio em custódia — liberação automática</Check>
                <Check>Termos de uso e política de privacidade transparentes</Check>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TrustBadge icon="🛡️" label="PCI-DSS" />
              <TrustBadge icon="🇧🇷" label="LGPD" />
              <TrustBadge icon="🔐" label="SSL/TLS" />
              <TrustBadge icon="✅" label="Anti-fraude" />
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section>
        <SectionTitle title="Perguntas frequentes" />
        <div className="max-w-3xl mx-auto space-y-3">
          <FAQ q="É legal fazer bolão de futebol?" a="Sim. Bolões de previsão esportiva entre amigos/grupos privados são baseados em habilidade (não azar) e são permitidos no Brasil. Consulte nosso Aviso Legal para mais detalhes." />
          <FAQ q="Quanto custa para usar a plataforma?" a="Zero. A plataforma é gratuita para o organizador. A receita vem da comissão sobre as cotas vendidas, que você mesmo define (5-15%)." />
          <FAQ q="Como funciona o pagamento?" a="Os participantes pagam via PIX (QR Code automático gerado pela PushinPay). A confirmação é instantânea via webhook." />
          <FAQ q="Quando recebo minha comissão?" a="A comissão é separada automaticamente a cada pagamento e pode ser sacada a qualquer momento para sua chave PIX." />
          <FAQ q="Posso criar vários bolões?" a="Sim! Crie quantos bolões quiser — para diferentes grupos de amigos, família, trabalho. Todos simultâneos." />
          <FAQ q="E se um jogo for cancelado?" a="Os pontos daquele jogo não são computados para nenhum participante. O ranking é recalculado automaticamente." />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="text-center py-12 animate-fadeIn">
        <div className="text-6xl mb-6 animate-float">⚽</div>
        <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
          Quer organizar seu próprio bolão?
        </h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto text-lg">
          Acesse o Portal do Organizador para criar e gerenciar bolões com comissão automática.
        </p>
        <Button size="lg" onClick={() => navigate('/organizador')} className="min-w-[260px]">
          📊 Acessar Portal do Organizador
        </Button>
        <p className="text-xs text-slate-500 mt-4">
          Cadastro gratuito · Sem mensalidade · Comece a monetizar
        </p>
      </section>
    </div>
  );
}

/* ===== Sub-Components ===== */

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center mb-10">
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{title}</h2>
      {sub && <p className="text-slate-400 mt-2">{sub}</p>}
    </div>
  );
}

function HeroStat({ n, label, delay }: { n: string; label: string; delay: number }) {
  return (
    <div className="text-center animate-fadeInUp" style={{ animationDelay: `${delay * 0.08}s` }}>
      <div className="text-3xl sm:text-4xl font-black text-emerald-300">{n}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function Step({ n, icon, title, children, delay }: {
  n: string; icon: string; title: string; children: ReactNode; delay: number;
}) {
  return (
    <Card className="p-6 relative overflow-hidden animate-fadeInUp" style={{ animationDelay: `${delay * 0.1}s` }}>
      <div className="absolute -right-3 -top-5 text-[7rem] font-black text-white/[0.02] leading-none">{n}</div>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{children}</p>
    </Card>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <Card className="p-5 group" hover>
      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
    </Card>
  );
}

function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
      <span>{children}</span>
    </li>
  );
}

function RevCard({ shares, value, comm, highlight }: { shares: number; value: number; comm: number; highlight?: boolean }) {
  const total = shares * value;
  const myCut = total * (comm / 100);
  const prize = total - myCut;
  return (
    <div className={`rounded-xl p-4 border transition-all ${
      highlight
        ? 'bg-emerald-500/10 border-emerald-400/30 shadow-lg shadow-emerald-500/10 scale-[1.02]'
        : 'bg-slate-900/40 border-white/[0.06] hover:border-white/[0.12]'
    }`}>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm text-slate-300">{shares} cotas × {brl(value)}</span>
        {highlight && <span className="text-[10px] px-2 py-0.5 bg-emerald-400 text-slate-950 rounded-full font-black uppercase tracking-wide">Popular</span>}
      </div>
      <div className="text-2xl font-black">{brl(total)} <span className="text-xs text-slate-500 font-normal">total</span></div>
      <div className="flex gap-4 mt-2 text-sm">
        <span className="text-emerald-300">💰 Você: <strong>{brl(myCut)}</strong></span>
        <span className="text-slate-400">🏆 Prêmio: {brl(prize)}</span>
      </div>
    </div>
  );
}

function RuleCard({ pts, label, example, color, icon }: {
  pts: string; label: string; example: string; icon: string;
  color: 'emerald' | 'blue' | 'yellow' | 'purple';
}) {
  const cls = {
    emerald: 'from-emerald-500/15 to-transparent border-emerald-500/25 text-emerald-300',
    blue: 'from-blue-500/15 to-transparent border-blue-500/25 text-blue-300',
    yellow: 'from-yellow-500/15 to-transparent border-yellow-500/25 text-yellow-300',
    purple: 'from-purple-500/15 to-transparent border-purple-500/25 text-purple-300',
  };
  return (
    <Card className={`p-5 text-center bg-gradient-to-b ${cls[color]}`}>
      <div className="text-3xl">{icon}</div>
      <div className="text-4xl font-black mt-2">{pts}</div>
      <div className="text-[10px] uppercase tracking-widest opacity-60 mt-0.5">pontos</div>
      <div className="font-bold mt-3 text-white text-sm">{label}</div>
      <div className="text-[11px] text-slate-400 mt-1">{example}</div>
    </Card>
  );
}

function PrizeSlot({ medal, place, pct, color }: { medal: string; place: string; pct: number; color: string }) {
  return (
    <div className={`bg-gradient-to-b ${color} border rounded-2xl p-6 text-center`}>
      <div className="text-5xl">{medal}</div>
      <div className="text-sm text-slate-300 mt-2">{place}</div>
      <div className="text-4xl font-black text-white mt-1">{pct}%</div>
      <div className="text-xs text-slate-500 mt-1">do prêmio total</div>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <div className="text-2xl">{icon}</div>
      <div className="text-xs font-bold mt-1 text-slate-300">{label}</div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <Card className="p-5">
      <div className="font-bold text-sm text-white mb-2">❓ {q}</div>
      <div className="text-sm text-slate-400 leading-relaxed">{a}</div>
    </Card>
  );
}
