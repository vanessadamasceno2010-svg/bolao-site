import { useEffect, useState } from 'react';
import { Badge, Button, Card, EmptyState, ProgressBar, Stat } from '../components/Layout';
import { ShareModal } from '../components/ShareModal';
import { navigate } from '../lib/router';
import { getBoloes, getCotasByBolao, onStorageChange } from '../lib/storage';
import { brl } from '../lib/scoring';
import type { Bolao } from '../types';

export function Dashboard() {
  const [boloes, setBoloes] = useState<Bolao[]>([]);
  useEffect(() => {
    const refresh = () => setBoloes(
      getBoloes().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
    refresh();
    return onStorageChange(refresh);
  }, []);

  let totalRevenue = 0, totalSharesSold = 0, totalParticipants = 0, totalArrecadado = 0;
  boloes.forEach(b => {
    const cotas = getCotasByBolao(b.id).filter(c => c.paymentStatus === 'paid');
    cotas.forEach(c => {
      totalRevenue += c.totalAmount * (b.commissionPercent / 100);
      totalSharesSold += c.quantity;
      totalArrecadado += c.totalAmount;
    });
    totalParticipants += cotas.length;
  });

  return (
    <div className="animate-fadeInUp">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <Badge color="blue">📊 Painel do Organizador</Badge>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Meus Bolões</h1>
          <p className="text-slate-400 mt-1">Acompanhe todos os seus bolões em um só lugar.</p>
        </div>
        <Button size="lg" onClick={() => navigate('/organizador/create')}>+ Novo Bolão</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat icon="🎯" label="Bolões" value={String(boloes.length)} />
        <Stat icon="👥" label="Participantes" value={String(totalParticipants)} accent="blue" />
        <Stat icon="💵" label="Arrecadado" value={brl(totalArrecadado)} accent="yellow" sub={`${totalSharesSold} cotas`} />
        <Stat icon="💰" label="Sua comissão" value={brl(totalRevenue)} accent="emerald" />
      </div>

      {boloes.length === 0 ? (
        <EmptyState
          icon="⚽"
          title="Nenhum bolão criado"
          desc="Crie seu primeiro bolão, compartilhe com os amigos e ganhe comissão em cada cota vendida!"
          action={() => navigate('/organizador/create')}
          actionLabel="🚀 Criar primeiro bolão"
        />
      ) : (
        <div className="space-y-4">
          {boloes.map(b => <BolaoCard key={b.id} bolao={b} />)}
        </div>
      )}
    </div>
  );
}

function BolaoCard({ bolao }: { bolao: Bolao }) {
  const [share, setShare] = useState(false);
  const cotas = getCotasByBolao(bolao.id);
  const paid = cotas.filter(c => c.paymentStatus === 'paid');
  const soldShares = paid.reduce((s, c) => s + c.quantity, 0);
  const arrecadado = paid.reduce((s, c) => s + c.totalAmount, 0);
  const comissao = arrecadado * (bolao.commissionPercent / 100);
  const deadlinePassed = new Date(bolao.deadline) < new Date();
  const link = `${window.location.origin}${window.location.pathname}#/b/${bolao.slug}`;

  return (
    <>
      <Card className="p-5 animate-fadeIn" hover>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-lg truncate">{bolao.name}</h3>
              {bolao.status === 'open' && !deadlinePassed && <Badge color="emerald">Ativo</Badge>}
              {bolao.status === 'open' && deadlinePassed && <Badge color="yellow">Prazo encerrado</Badge>}
              {bolao.status === 'filled' && <Badge color="blue">Lotado</Badge>}
              {bolao.status === 'closed' && <Badge color="slate">Encerrado</Badge>}
            </div>
            <div className="text-xs text-slate-500">
              #{bolao.slug} · {brl(bolao.shareValue)}/cota · {bolao.totalShares} cotas
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="secondary" onClick={() => setShare(true)}>📲 Compartilhar</Button>
            <Button size="sm" onClick={() => navigate(`/organizador/manage/${bolao.id}`)}>Gerenciar →</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-sm mb-4">
          <Mini label="Cotas" value={`${soldShares}/${bolao.totalShares}`} />
          <Mini label="Participantes" value={String(paid.length)} />
          <Mini label="Arrecadado" value={brl(arrecadado)} />
          <Mini label="Sua comissão" value={brl(comissao)} accent />
        </div>

        <ProgressBar value={soldShares} max={bolao.totalShares} />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
          <span>{soldShares} vendidas</span>
          <span>{Math.round(soldShares / bolao.totalShares * 100)}% preenchido</span>
        </div>
      </Card>

      <ShareModal bolao={bolao} link={link} open={share} onClose={() => setShare(false)} />
    </>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`font-bold text-sm ${accent ? 'text-emerald-300' : 'text-slate-200'}`}>{value}</div>
    </div>
  );
}
