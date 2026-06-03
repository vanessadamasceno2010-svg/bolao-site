import { useState } from 'react';
import { Button, Card, Input, Textarea } from '../components/Layout';
import { navigate } from '../lib/router';
import { getBolaoBySlug, getOrgSession, saveBolao, slugify, uid } from '../lib/storage';
import { toast } from '../lib/toast';
import type { Bolao } from '../types';
import { brl } from '../lib/scoring';

export function CreateBolao() {
  const org = getOrgSession();

  const [name, setName]                 = useState('');
  const [description, setDescription]   = useState('');
  const [pixKey, setPixKey]             = useState(org ? '' : '');
  const [shareValue, setShareValue]     = useState(50);
  const [totalShares, setTotalShares]   = useState(50);
  const [deadline, setDeadline]         = useState('2026-06-10');
  const [commission, setCommission]     = useState(12);
  const [referralBonus, setReferralBonus] = useState(5);
  const [first, setFirst]               = useState(50);
  const [second, setSecond]             = useState(30);
  const [third, setThird]               = useState(20);
  const [loading, setLoading]           = useState(false);

  const organizerName  = org?.name  ?? '';
  const organizerEmail = org?.email ?? '';

  const totalAmount  = shareValue * totalShares;
  const myRevenue    = totalAmount * (commission / 100);
  const prizePool    = totalAmount - myRevenue;
  const prizeSum     = first + second + third;
  const validPrize   = prizeSum === 100;

  const ex1Prize     = prizePool * first / 100;
  const exRefBonus   = ex1Prize * referralBonus / 100;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validPrize) { toast.error('Distribuição inválida', 'A soma dos prêmios deve ser 100%.'); return; }
    if (!org) { toast.error('Faça login como organizador.'); return; }
    if (!pixKey || !name) {
      toast.warning('Campos obrigatórios', 'Preencha todos os campos com *.'); return;
    }
    setLoading(true);
    setTimeout(() => {
      let baseSlug = slugify(name) || 'bolao';
      let finalSlug = baseSlug; let i = 1;
      while (getBolaoBySlug(finalSlug)) finalSlug = `${baseSlug}-${i++}`;

      const bolao: Bolao = {
        id: uid(), slug: finalSlug, name, description,
        organizerName, organizerEmail, pixKey,
        shareValue, totalShares,
        deadline: new Date(deadline + 'T23:59:59').toISOString(),
        scoringRules: { exactScore: 3, correctWinner: 1, correctDraw: 2, goalDifference: 2 },
        prizeDistribution: { first, second, third },
        commissionPercent: commission,
        referralBonusPercent: referralBonus,
        createdAt: new Date().toISOString(),
        status: 'open',
      };
      saveBolao(bolao);
      toast.success('Bolão criado!', `"${name}" pronto para compartilhar.`);
      navigate(`/organizador/manage/${bolao.id}`);
    }, 800);
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeInUp">
      <div className="mb-8">
        <button onClick={() => navigate('/organizador/dashboard')} className="text-slate-400 hover:text-white text-sm mb-2">← voltar ao painel</button>
        <h1 className="text-3xl sm:text-4xl font-black">Criar novo bolão ⚽</h1>
        <p className="text-slate-400 mt-2">Preencha as informações abaixo. Leva menos de 2 minutos.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Básico */}
          <Card className="p-6 space-y-4 animate-fadeInUp stagger-1">
            <h2 className="font-bold text-lg">📝 Informações básicas</h2>
            <Input label="Nome do bolão" value={name} onChange={setName}
              placeholder="Ex: Bolão Copa 2026 - Galera do trampo" required />
            <Textarea label="Descrição (opcional)" value={description} onChange={setDescription}
              placeholder="Bora ver quem manja mais de futebol! Prêmio para os 3 primeiros." />
          </Card>

          {/* Organizador — dados fixos da sessão */}
          <Card className="p-6 space-y-4 animate-fadeInUp stagger-2">
            <h2 className="font-bold text-lg">👤 Seus dados (organizador)</h2>
            <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3 text-sm text-emerald-200">
              <strong>{organizerName}</strong> · {organizerEmail}
              <div className="text-xs text-emerald-300/60 mt-0.5">dados da sua conta de organizador</div>
            </div>
            <Input label="Sua chave PIX (para receber comissão)" value={pixKey} onChange={setPixKey}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              hint="Chave para receber sua comissão via PIX" required />
          </Card>

          {/* Valor e cotas */}
          <Card className="p-6 space-y-4 animate-fadeInUp stagger-3">
            <h2 className="font-bold text-lg">💰 Valor e cotas</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="Valor da cota" type="number" prefix="R$" value={shareValue}
                onChange={v => setShareValue(Number(v) || 0)} min={5} step={5} required />
              <Input label="Total de cotas" type="number" value={totalShares}
                onChange={v => setTotalShares(Number(v) || 0)} min={2} max={1000} required />
              <Input label="Data limite" type="date" value={deadline} onChange={setDeadline}
                hint="Último dia para inscrição" required />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-2">Valores populares:</div>
              <div className="flex flex-wrap gap-2">
                {[{s:30,v:20,l:'Econômico'},{s:50,v:50,l:'Popular'},{s:100,v:100,l:'Premium'},{s:200,v:50,l:'Grande'}].map(p => (
                  <button key={p.l} type="button" onClick={() => { setTotalShares(p.s); setShareValue(p.v); }}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                      totalShares===p.s&&shareValue===p.v
                        ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                    }`}>{p.l} ({p.s}×{brl(p.v)})</button>
                ))}
              </div>
            </div>
          </Card>

          {/* Distribuição prêmio */}
          <Card className="p-6 space-y-4 animate-fadeInUp stagger-4">
            <h2 className="font-bold text-lg">🏆 Distribuição do prêmio</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="🥇 1º lugar (%)" type="number" value={first} onChange={v => setFirst(Number(v)||0)} min={0} max={100} />
              <Input label="🥈 2º lugar (%)" type="number" value={second} onChange={v => setSecond(Number(v)||0)} min={0} max={100} />
              <Input label="🥉 3º lugar (%)" type="number" value={third} onChange={v => setThird(Number(v)||0)} min={0} max={100} />
            </div>
            <div className={`text-sm font-semibold flex items-center gap-2 ${validPrize?'text-emerald-400':'text-red-400'}`}>
              {validPrize?'✓':'✗'} Soma: {prizeSum}% {!validPrize&&'— precisa ser 100%'}
            </div>
          </Card>

          {/* Comissão */}
          <Card className="p-6 space-y-4 animate-fadeInUp stagger-5">
            <h2 className="font-bold text-lg">💵 Sua comissão</h2>
            <Input label="Comissão do organizador (%)" type="number" value={commission}
              onChange={v => setCommission(Math.min(15,Math.max(5,Number(v)||0)))} min={5} max={15}
              hint="Entre 5% e 15% — recomendado: 10–12%" />
            <div className="flex gap-2">
              {[8,10,12,15].map(v => (
                <button key={v} type="button" onClick={() => setCommission(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                    commission===v ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}>{v}%</button>
              ))}
            </div>
          </Card>

          {/* ★ BÔNUS DE INDICAÇÃO */}
          <Card className="p-6 space-y-4 border-yellow-500/20 bg-yellow-500/[0.04] animate-fadeInUp stagger-5">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">🔗 Bônus de indicação</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold uppercase tracking-wide">Novo</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Cada participante recebe um <strong className="text-white">link único de indicação</strong>.
              Se alguém entrar no bolão por esse link e chegar ao <strong className="text-yellow-300">1º, 2º ou 3º lugar</strong>,
              quem indicou ganha automaticamente uma porcentagem do prêmio do indicado.
            </p>
            <Input label="Bônus de indicação (%)" type="number" value={referralBonus}
              onChange={v => setReferralBonus(Math.min(10, Math.max(1, Number(v)||5)))} min={1} max={10}
              hint="Porcentagem do PRÊMIO do indicado que vai para quem o trouxe. Entre 1% e 10%." />
            <div className="flex gap-2">
              {[3,5,8,10].map(v => (
                <button key={v} type="button" onClick={() => setReferralBonus(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                    referralBonus===v ? 'border-yellow-400/50 bg-yellow-500/10 text-yellow-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}>{v}%</button>
              ))}
            </div>

            {/* Exemplo visual */}
            <div className="bg-slate-900/60 border border-yellow-500/20 rounded-xl p-4 text-sm space-y-2">
              <div className="text-yellow-300 font-bold text-xs uppercase tracking-widest mb-2">📊 Exemplo de como funciona</div>
              <div className="text-slate-300">
                Pedro indicou Maria. Maria ficou em <strong className="text-yellow-300">1º lugar</strong> e ganhou{' '}
                <strong className="text-white">{brl(ex1Prize)}</strong>.
              </div>
              <div className="text-emerald-300 font-bold">
                → Pedro recebe <strong>{referralBonus}%</strong> do prêmio da Maria = <strong>{brl(exRefBonus)}</strong> de bônus! 🎉
              </div>
              <div className="text-slate-500 text-xs">
                * O bônus é pago via PIX após o encerramento da Copa. Não reduz o prêmio do indicado — sai da comissão do organizador.
              </div>
            </div>
          </Card>
        </div>

        {/* Resumo lateral */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="p-6 bg-gradient-to-br from-emerald-500/[0.08] to-yellow-500/[0.04] border-emerald-500/20 animate-fadeIn">
              <h3 className="font-bold mb-5">📊 Resumo</h3>
              <div className="space-y-3 text-sm">
                <SRow label="Total (bolão lotado)" value={brl(totalAmount)} bold />
                <div className="h-px bg-white/10" />
                <SRow label={`💰 Sua comissão (${commission}%)`} value={brl(myRevenue)} accent="emerald" bold />
                <SRow label="🏆 Prêmio total"  value={brl(prizePool)} accent="yellow" />
                <div className="h-px bg-white/10" />
                <SRow label={`🥇 1º (${first}%)`}  value={brl(prizePool*first/100)} />
                <SRow label={`🥈 2º (${second}%)`} value={brl(prizePool*second/100)} />
                <SRow label={`🥉 3º (${third}%)`}  value={brl(prizePool*third/100)} />
                <div className="h-px bg-white/10" />
                <SRow label={`🔗 Bônus indicação (${referralBonus}% do prêmio)`} value="automático" accent="yellow" />
              </div>

              <Button type="submit" size="lg" full className="mt-6" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"/>
                    Criando...
                  </span>
                ) : '✅ Criar Bolão'}
              </Button>
              <p className="text-[11px] text-slate-500 mt-3 text-center">
                Após criar, você receberá um link para compartilhar.
              </p>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

function SRow({ label, value, bold, accent }: {
  label: string; value: string; bold?: boolean; accent?: 'emerald'|'yellow';
}) {
  const c = accent==='emerald' ? 'text-emerald-300' : accent==='yellow' ? 'text-yellow-300' : 'text-slate-200';
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`${bold?'font-black text-lg':'font-semibold'} ${c}`}>{value}</span>
    </div>
  );
}
